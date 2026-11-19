import { FormEvent, useEffect, useRef, useState } from "react";
import { api, ApiError, withConfirm } from "../api";
import { listenOnce, speak, VOICE_LANGS, voiceSupported } from "../voice/voice";
import { useUi } from "./common";

/** Text commands (and the optional voice module) for assigning tasks to agents. */
export default function CommandBar({ prefill, onResult, canCommand }: { prefill: string; onResult: () => void; canCommand: boolean }) {
  const { ask, toast } = useUi();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [lang, setLang] = useState(() => { try { return localStorage.getItem("voiceLang") || "ru-RU"; } catch { return "ru-RU"; } });
  const [hints, setHints] = useState<[string, string[]][]>([]);
  const stopRef = useRef<() => void>(() => {});
  const inputRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { if (prefill) { setText(prefill); inputRef.current?.focus(); } }, [prefill]);
  useEffect(() => {
    const t = text.trim();
    if (t.length < 6 || t.startsWith("/") || t.startsWith("@")) { setHints([]); return; }
    const id = setTimeout(() => api(`/route?text=${encodeURIComponent(t)}`).then(setHints).catch(() => {}), 350);
    return () => clearTimeout(id);
  }, [text]);

  async function send(t: string, source: "text" | "voice") {
    if (!t.trim()) return;
    setBusy(true);
    try {
      const r = await withConfirm((pw) => api("/commands", { body: { text: t, source, confirm_password: pw } }), ask);
      if (!r) return;
      const msg = r.type === "task"
        ? `Задача #${r.task.id} → ${r.task.agent}: ${r.task.status === "awaiting_approval" ? "ждёт подтверждения владельца" : "в очереди"}`
        : r.type === "status" ? `Выполняется ${r.running}, в очереди ${r.queued}, ждут подтверждения ${r.awaiting_approval}. Расход сегодня $${r.spent_today_usd.toFixed(2)} из $${r.daily_budget_usd}.`
        : r.type === "stopped" ? r.message : r.type === "help" ? r.message
        : r.type === "agents" ? r.districts.map((d: any) => `${d.district}: ${d.agents.length}`).join("; ")
        : r.type === "cancel" ? (r.ok ? `Задача #${r.task_id} отменена` : `Задачу #${r.task_id} отменить нельзя`) : "Готово";
      toast(msg);
      if (source === "voice") speak(msg, lang);
      setText(""); onResult();
    } catch (e: any) {
      toast(e instanceof ApiError ? e.message : String(e), "err");
    } finally { setBusy(false); }
  }

  async function voice() {
    if (listening) { stopRef.current(); return; }
    setListening(true);
    const { promise, stop } = listenOnce(lang, (partial) => setText(partial));
    stopRef.current = stop;
    try { const t = await promise; setListening(false); if (t) await send(t, "voice"); }
    catch (e: any) { setListening(false); toast(e.message, "err"); }
  }

  const submit = (e: FormEvent) => { e.preventDefault(); send(text, "text"); };
  if (!canCommand) return <div className="cmdbar readonly">Режим просмотра: роль без права ставить задачи</div>;
  return (
    <form className="cmdbar" onSubmit={submit}>
      {hints.length > 0 && (
        <div className="hints">JARVIS передаст: {hints.map(([t, a]) => <span key={t}><b>{t}</b> {a.join(", ")}</span>)}</div>
      )}
      <div className="row">
        <textarea ref={inputRef} rows={1} value={text} placeholder={window.innerWidth < 700 ? "Задача для JARVIS…  (/help)" : "Задача для JARVIS… (@агент — конкретному, !write — с правом правки, /status, /stop, /help)"}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text, "text"); } }} />
        {voiceSupported && (
          <>
            <select value={lang} onChange={(e) => { setLang(e.target.value); try { localStorage.setItem("voiceLang", e.target.value); } catch {} }} aria-label="Язык голоса">
              {VOICE_LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
            <button type="button" className={`mic ${listening ? "on" : ""}`} onClick={voice} title="Голосовая команда">{listening ? "■" : "🎤"}</button>
          </>
        )}
        <button className="primary" disabled={busy || !text.trim()}>➤</button>
      </div>
    </form>
  );
}
