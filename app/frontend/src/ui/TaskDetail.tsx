import { useEffect, useState } from "react";
import { api, fmtUsd } from "../api";
import type { Task } from "../types";
import { Badge } from "./common";

const KIND_RU: Record<string, string> = {
  status: "статус", session: "сессия", "delegate.start": "JARVIS → агент", "delegate.finish": "агент завершил", tool: "инструмент", text: "сообщение",
};

export default function TaskDetail({ id, tick, onClose }: { id: number; tick: number; onClose: () => void }) {
  const [t, setT] = useState<Task | null>(null);
  useEffect(() => { api<Task>(`/tasks/${id}`).then(setT).catch(() => {}); }, [id, tick]);
  if (!t) return null;
  const delegated: string[] = JSON.parse(t.delegated || "[]");
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <div><h3>Задача #{t.id} <Badge s={t.status} /></h3>
            <div className="muted small">агент <b>{t.agent}</b> · режим {t.mode} · бюджет {fmtUsd(t.max_budget_usd)} · расход {fmtUsd(t.cost_usd)} · {t.executor ?? ""}</div></div>
          <button className="ghost close" onClick={onClose}>✕</button>
        </div>
        <p className="prompt">{t.prompt}</p>
        {(delegated.length > 0 || (t.delegates_now?.length ?? 0) > 0) && (
          <p className="small">Специалисты: {[...new Set([...delegated, ...(t.delegates_now ?? [])])].map((a) => <span key={a} className="tag">{a}</span>)}</p>
        )}
        {t.result && <><h4>Результат</h4><pre className="result">{t.result}</pre></>}
        {t.error && <><h4>Ошибка</h4><pre className="result err">{t.error}</pre></>}
        <h4>Ход выполнения</h4>
        <ul className="events">
          {t.events?.map((e, i) => {
            const d = JSON.parse(e.data || "{}");
            return <li key={i}><span className="muted">{new Date(e.ts * 1000).toLocaleTimeString("ru-RU")}</span> {KIND_RU[e.kind] ?? e.kind}: {d.status ?? d.agent ?? d.name ?? d.text ?? d.session_id ?? ""}</li>;
          })}
        </ul>
      </div>
    </div>
  );
}
