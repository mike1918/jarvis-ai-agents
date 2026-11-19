import { useEffect, useState } from "react";
import { api, fmtUsd } from "../api";
import { shortName } from "../city/TechPark";
import type { AgentRow, Task } from "../types";
import { ago, Badge, useUi } from "./common";

interface DistrictDetail { folder: string; district: string; planned_capacity: number; count: number; agents: AgentRow[] }

/** Building panel: agents of the district, their speciality, state and tasks. */
export default function DistrictPanel({ folder, tick, onClose, onAssign, onOpenTask }:
  { folder: string; tick: number; onClose: () => void; onAssign: (agent: string) => void; onOpenTask: (id: number) => void }) {
  const { toast } = useUi();
  const [d, setD] = useState<DistrictDetail | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  useEffect(() => { api<DistrictDetail>(`/districts/${folder}`).then(setD).catch((e) => toast(e.message, "err")); }, [folder, tick, toast]);
  if (!d) return <aside className="panel"><div className="muted">Загрузка…</div></aside>;
  const list = d.agents.filter((a) => !q || a.name.includes(q.toLowerCase()) || a.description.toLowerCase().includes(q.toLowerCase()));
  const working = d.agents.filter((a) => a.state === "working").length;
  return (
    <aside className="panel">
      <div className="panel-head">
        <div>
          <div className="eyebrow">{d.folder}</div>
          <h2>{shortName(d.folder)}</h2>
          <div className="muted">{d.district}</div>
        </div>
        <button className="ghost close" onClick={onClose} aria-label="Закрыть">✕</button>
      </div>
      <div className="kpis">
        <div><b>{d.count}</b><span>агентов</span></div>
        <div><b>{working}</b><span>работают</span></div>
        <div><b>{d.planned_capacity}</b><span>мест по плану</span></div>
      </div>
      {d.count === 0 && <p className="muted">Район зарезервирован для будущих агентов (цель — 300). Добавляются командой <code>tools/agentlib.py new</code> в библиотеке.</p>}
      {d.count > 6 && <input className="search" placeholder="Поиск агента…" value={q} onChange={(e) => setQ(e.target.value)} />}
      <ul className="agents">
        {list.map((a) => (
          <li key={a.name} className={open === a.name ? "open" : ""}>
            <button className="agent-row" onClick={() => setOpen(open === a.name ? null : a.name)}>
              <span className={`state ${a.state}`} />
              <span className="name">{a.name}</span>
              <span className="tag">{a.access}</span>
              <span className="tag">{a.model}</span>
            </button>
            {open === a.name && <AgentDetail a={a} onAssign={onAssign} onOpenTask={onOpenTask} />}
          </li>
        ))}
      </ul>
    </aside>
  );
}

function AgentDetail({ a, onAssign, onOpenTask }: { a: AgentRow; onAssign: (n: string) => void; onOpenTask: (id: number) => void }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => { api(`/agents/${a.name}`).then((r) => setTasks(r.tasks)).catch(() => {}); }, [a.name]);
  return (
    <div className="agent-detail">
      <p>{a.description}</p>
      {a.note && <p className="note">⚠️ {a.note}</p>}
      <div className="muted small">Инструменты: {a.tools.join(", ")}</div>
      <div className="muted small">Состояние: <Badge s={a.state} /> · задач всего {a.stats.n} · ошибок {a.stats.failed ?? 0} · расход {fmtUsd(a.stats.usd)}</div>
      <div className="row"><button className="primary small" onClick={() => onAssign(a.name)}>Поставить задачу @{a.name}</button></div>
      {tasks.length > 0 && (
        <ul className="tasks compact">
          {tasks.slice(0, 6).map((t) => (
            <li key={t.id} onClick={() => onOpenTask(t.id)}><Badge s={t.status} /> #{t.id} {t.prompt.slice(0, 60)} <span className="muted">{ago(t.created_at)}</span></li>
          ))}
        </ul>
      )}
    </div>
  );
}
