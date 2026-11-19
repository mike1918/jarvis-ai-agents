/**
 * Voice control module (separate and optional).
 *  - Speech-to-text: the LOCAL whisper.cpp server through the city backend when it is running (MediaRecorder →
 *    /api/voice/transcribe; works in Safari on iPhone and every modern browser, audio never leaves your machine);
 *    otherwise the browser's Web Speech API (webkitSpeechRecognition) as a fallback.
 *  - Text-to-speech: Piper on the server (/api/voice/speak) when a voice is installed, otherwise speechSynthesis.
 * The transcript is sent as an ordinary text command with source="voice", so every permission, budget and
 * confirmation rule applies to voice exactly as to typed commands.
 */
const Ctor: any = typeof window !== "undefined"
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : undefined;

export const browserSttSupported = !!Ctor;
export const recorderSupported = typeof window !== "undefined" && "MediaRecorder" in window && !!navigator.mediaDevices?.getUserMedia;
export const voiceSupported = browserSttSupported || recorderSupported;
export const VOICE_LANGS = [
  { id: "ru-RU", label: "RU" },
  { id: "he-IL", label: "HE" },
  { id: "en-US", label: "EN" },
];

let serverVoice = { stt: false, tts: false };
export async function refreshVoiceServices() {
  try {
    const r = await fetch("/api/services", { credentials: "same-origin" }).then((x) => x.json());
    serverVoice = { stt: !!r?.stt?.ready, tts: !!r?.tts?.ready };
  } catch { serverVoice = { stt: false, tts: false }; }
  return serverVoice;
}
export const voiceEngine = () => (serverVoice.stt && recorderSupported ? "whisper.cpp (локально)" : browserSttSupported ? "браузер" : "нет");

function listenBrowser(lang: string, onPartial: (t: string) => void) {
  const rec = new Ctor();
  rec.lang = lang; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
  let finalText = "";
  const promise = new Promise<string>((resolve, reject) => {
    rec.onresult = (e: any) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript; else interim += r[0].transcript;
      }
      onPartial(`${finalText} ${interim}`.trim());
    };
    rec.onerror = (e: any) => reject(new Error(e.error === "not-allowed" ? "Нет доступа к микрофону" : `Ошибка распознавания: ${e.error}`));
    rec.onend = () => resolve(finalText.trim());
  });
  rec.start();
  return { promise, stop: () => rec.stop() };
}

function listenWhisper(lang: string, onPartial: (t: string) => void) {
  let stopFn = () => {};
  const promise = (async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => { throw new Error("Нет доступа к микрофону"); });
    const type = ["audio/webm;codecs=opus", "audio/mp4", "audio/ogg"].find((t) => (MediaRecorder as any).isTypeSupported?.(t)) ?? "";
    const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const stopped = new Promise<void>((res) => (rec.onstop = () => res()));
    rec.start();
    onPartial("🎙 запись… нажмите ■, чтобы закончить");
    const auto = setTimeout(() => rec.state !== "inactive" && rec.stop(), 15000);   // at most 15 s per command
    stopFn = () => rec.state !== "inactive" && rec.stop();
    await stopped; clearTimeout(auto); stream.getTracks().forEach((t) => t.stop());
    onPartial("распознаю локально…");
    const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
    const r = await fetch(`/api/voice/transcribe?lang=${lang.slice(0, 2)}`, { method: "POST", credentials: "same-origin",
      headers: { "Content-Type": (rec.mimeType || "audio/webm").split(";")[0] }, body: blob });
    if (!r.ok) throw new Error(`Распознавание недоступно (${r.status})`);
    const text = ((await r.json()).text || "").trim();
    onPartial(text); return text;
  })();
  return { promise, stop: () => stopFn() };
}

export function listenOnce(lang: string, onPartial: (t: string) => void): { promise: Promise<string>; stop: () => void } {
  if (serverVoice.stt && recorderSupported) return listenWhisper(lang, onPartial);
  if (browserSttSupported) return listenBrowser(lang, onPartial);
  return { promise: Promise.reject(new Error("Голосовой ввод не поддерживается этим браузером")), stop: () => {} };
}

export async function speak(text: string, lang: string) {
  if (serverVoice.tts) {
    try {
      const r = await fetch("/api/voice/speak", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.slice(0, 300), lang: lang.slice(0, 2) }) });
      if (r.ok) { const url = URL.createObjectURL(await r.blob()); const a = new Audio(url); a.onended = () => URL.revokeObjectURL(url); await a.play(); return; }
    } catch { /* fall back to the browser voice */ }
  }
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text.slice(0, 300));
  u.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
