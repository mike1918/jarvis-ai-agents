/**
 * Voice control module (separate and optional). Uses the browser's built-in Web Speech API — no paid service.
 * iPhone Safari (iOS 14.5+) and desktop Chrome expose webkitSpeechRecognition; elsewhere `voiceSupported` is false.
 * The transcript is sent as an ordinary text command with source="voice", so every permission,
 * budget and confirmation rule applies to voice exactly as to typed commands.
 */
const Ctor: any = typeof window !== "undefined"
  ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  : undefined;

export const voiceSupported = !!Ctor;
export const VOICE_LANGS = [
  { id: "ru-RU", label: "RU" },
  { id: "he-IL", label: "HE" },
  { id: "en-US", label: "EN" },
];

export function listenOnce(lang: string, onPartial: (t: string) => void): { promise: Promise<string>; stop: () => void } {
  if (!Ctor) return { promise: Promise.reject(new Error("Голосовой ввод не поддерживается этим браузером")), stop: () => {} };
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = true;
  rec.maxAlternatives = 1;
  rec.continuous = false;
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
    rec.onerror = (e: any) =>
      reject(new Error(e.error === "not-allowed" ? "Нет доступа к микрофону" : `Ошибка распознавания: ${e.error}`));
    rec.onend = () => resolve(finalText.trim());
  });
  rec.start();
  return { promise, stop: () => rec.stop() };
}

export function speak(text: string, lang: string) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text.slice(0, 300));
  u.lang = lang;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}
