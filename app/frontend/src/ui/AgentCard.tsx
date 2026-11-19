import { useEffect, useState } from "react";
import { api, fmtUsd } from "../api";
import { STATE_COLOR, STATE_RU } from "../world/People";
import { useWorld, type VisualState } from "../world/store";
import { ago, Badge, useUi } from "./common";

const TYPE_RU: Record<string, string> = {
  "task.created": "задача создана", "task.assigned": "назначена", "task.started": "старт", "task.progress": "ход работы", "task.waiting": "ожидание",
  "task.failed": "ошибка", "task.completed": "завершена", "agent.started": "агент начал", "agent.stopped": "агент закончил",
  "agent.status_changed": "статус", "tool.started": "инструмент", "tool.completed": "инструмент ок", "tool.failed": "инструмент ошибка",
  "approval.requested": "запрошено подтверждение", "approval.resolved": "подтверждение решено", "budget.threshold_reached": "порог бюджета",
};

/** Agent card: real data from /api/agents/{name} (registry + tasks + unified event log). */
export default function AgentCard({ tick, onAssign, onOpenTask, perms }: { tick: number; onAssign: (n: string) => void; onOpenTask: (id: number) => void; perms: string[] }) {
  const name = useWorld((s) => s.agent), select = useWorld((s) => s.selectAgent), live = useWorld((s) => (name ? s.states[name] : undefined));
  const { toast } = useUi();
  const [a, setA] = useState<any>(null);
  useEffect(() => { if (!name) return; setA(null); api(`/agents/${name}`).then(setA).catch((e) => toast(e.message, "err")); }, [name, tick, toast]);
  if (!name) return null;
  const st: VisualState = live?.state ?? a?.visual?.state ?? "idle";
  const cur = a?.current_task;
  const dur = cur?.started_at ? Math.round(Date.now() / 1000 - cur.started_at) : null;
  const cancel = async () => { try { const r = await api(`/tasks/${cur.id}/cancel`, { body: {} }); toast(r.ok ? "Задача отменена" : "Отменить нельзя", r.ok ? "ok" : "err"); } catch (e: any) { toast(e.message, "err"); } };
  return (
    <aside className="panel agent-card">
      <div className="panel-head">
        <div><div className="eyebrow">агент · {a?.folder ?? ""}</div><h2>{name}</h2>
          <span className="badge" style={{ borderColor: STATE_COLOR[st], color: STATE_COLOR[st] }}>{STATE_RU[st]}</span></div>
        <button className="ghost close" onClick={() => select(null)} aria-label="Закрыть">✕</button>
      </div>
      {!a ? <div className="muted">Загрузка…</div> : <>
        <p className="small">{a.description}</p>
        <table><tbody>
          {live?.runtime && st !== "idle" && <tr><td className="muted">Исполнитель</td><td>{live.runtime}</td></tr>}
          <tr><td className="muted">Модель</td><td>{a.last_model ? `${a.last_model} (последний запуск)` : `${a.model} (из определения агента)`}</td></tr>
          <tr><td className="muted">Доступ</td><td>{a.access} · {a.tools.join(", ")}</td></tr>
          <tr><td className="muted">Текущая задача</td><td>{cur ? <a href="#" onClick={(e) => { e.preventDefault(); onOpenTask(cur.id); }}>#{cur.id} {cur.prompt.slice(0, 80)}</a> : "нет"}</td></tr>
          {cur && <tr><td className="muted">Статус</td><td><Badge s={cur.status} /> {dur !== null && cur.status === "running" ? `· ${dur} с` : ""} · проект #{cur.project_id}</td></tr>}
          {cur && <tr><td className="muted">Расход</td><td>{fmtUsd(cur.cost_usd)} из бюджета {fmtUsd(cur.max_budget_usd)}</td></tr>}
          <tr><td className="muted">Инструменты в работе</td><td>{a.tools_used.length ? a.tools_used.join(", ") : "—"}</td></tr>
          <tr><td className="muted">Файлы</td><td>{a.files.length ? a.files.map((f: string) => <div key={f}><code>{f}</code></div>) : "—"}</td></tr>
        </tbody></table>
        {a.note && <p className="note small">⚠️ {a.note}</p>}
        <div className="row wrap">
          {perms.includes("command") && <button className="primary small" onClick={() => onAssign(name)}>Поставить задачу</button>}
          {cur && ["running", "queued", "awaiting_approval"].includes(cur.status) && perms.includes("task.cancel_own") && <button className="ghost small" onClick={cancel}>Отменить задачу</button>}
        </div>
        <h4>Журнал действий</h4>
        <ul className="events">
          {a.events.slice().reverse().slice(0, 25).map((e: any) => (
            <li key={e.id}><span className="muted">{new Date(e.ts * 1000).toLocaleTimeString("ru-RU")}</span> {TYPE_RU[e.type] ?? e.type}
              {e.data?.tool ? `: ${e.data.tool}` : ""}{e.data?.file ? ` ${e.data.file}` : ""}{e.task_id ? ` · #${e.task_id}` : ""}
              {!e.verified && <span className="tag warn" title="Событие не из реального запуска (DRY RUN)">симуляция</span>}</li>
          ))}
          {!a.events.length && <li className="muted">Событий пока нет — агент ещё не получал задач.</li>}
        </ul>
        <h4>Последние задачи</h4>
        <ul className="tasks compact">{a.tasks.slice(0, 6).map((t: any) => <li key={t.id} onClick={() => onOpenTask(t.id)}><Badge s={t.status} /> #{t.id} {t.prompt.slice(0, 60)} <span className="muted">{ago(t.created_at)}</span></li>)}
          {!a.tasks.length && <li className="muted">Нет</li>}</ul>
      </>}
    </aside>
  );
}
