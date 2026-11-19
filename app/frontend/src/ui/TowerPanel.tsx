import { FormEvent, useEffect, useState } from "react";
import { api, fmtUsd, withConfirm } from "../api";
import type { Approval, Limits, Me, Task } from "../types";
import { ago, Badge, useUi } from "./common";

type Tab = "overview" | "tasks" | "approvals" | "limits" | "costs" | "integrations" | "audit" | "users";

/** Central JARVIS tower: the general control panel. */
export default function TowerPanel({ me, limits, tick, onClose, onOpenTask, refresh }:
  { me: Me; limits: Limits | null; tick: number; onClose: () => void; onOpenTask: (id: number) => void; refresh: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const can = (p: string) => me.perms.includes(p);
  const tabs: [Tab, string, boolean][] = [
    ["overview", "Обзор", true], ["tasks", "Задачи", true], ["approvals", "Подтверждения", true], ["limits", "Лимиты", true],
    ["costs", "Расходы и ошибки", true], ["integrations", "Интеграции", true], ["audit", "Аудит", can("audit.read")], ["users", "Доступ", can("users.manage")],
  ];
  return (
    <aside className="panel wide">
      <div className="panel-head">
        <div><div className="eyebrow">Рова Алеф · 00-jarvis</div><h2>Башня JARVIS</h2><div className="muted">Центр управления городом агентов</div></div>
        <button className="ghost close" onClick={onClose} aria-label="Закрыть">✕</button>
      </div>
      <nav className="tabs">{tabs.filter((t) => t[2]).map(([id, l]) => <button key={id} className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{l}</button>)}</nav>
      {tab === "overview" && <Overview limits={limits} tick={tick} />}
      {tab === "tasks" && <Tasks tick={tick} me={me} onOpenTask={onOpenTask} />}
      {tab === "approvals" && <Approvals tick={tick} canApprove={can("approve")} refresh={refresh} />}
      {tab === "limits" && <LimitsTab limits={limits} canEdit={can("limits.update")} canResume={can("resume")} refresh={refresh} />}
      {tab === "costs" && <Costs tick={tick} />}
      {tab === "audit" && <Audit tick={tick} />}
      {tab === "users" && <Users />}
      {tab === "integrations" && <Integrations tick={tick} />}
    </aside>
  );
}

function Overview({ limits, tick }: { limits: Limits | null; tick: number }) {
  const [lib, setLib] = useState<any>(null); const [stats, setStats] = useState<any>(null);
  useEffect(() => { api("/library").then(setLib); api("/stats").then(setStats); }, [tick]);
  const by = Object.fromEntries((stats?.by_status ?? []).map((r: any) => [r.status, r.n]));
  return (
    <div>
      <div className="kpis">
        <div><b>{lib?.count_active ?? "…"}</b><span>активных агентов</span></div>
        <div><b>{limits?.running ?? 0}</b><span>выполняется</span></div>
        <div><b>{by.queued ?? 0}</b><span>в очереди</span></div>
        <div><b>{by.awaiting_approval ?? 0}</b><span>ждут подтверждения</span></div>
        <div><b>{fmtUsd(limits?.spent_today_usd)}</b><span>сегодня из {fmtUsd(limits?.daily_budget_usd)}</span></div>
        <div><b>{by.failed ?? 0}</b><span>ошибок всего</span></div>
      </div>
      {lib && <p className="muted small">Библиотека: {lib.path} @ <code>{lib.commit}</code> · {lib.count_active} активных, {lib.count_disabled} отключён · цель {lib.target_total} · исполнитель: <b>{limits?.executor === "dry" ? "DRY RUN (без вызова API)" : "Claude Code CLI"}</b></p>}
      <p className="small">Команды: текст → JARVIS сам выбирает специалистов; <code>@агент</code> — напрямую; <code>!write</code> — с правом правки файлов (подтверждение владельца); <code>/status</code>, <code>/stop</code>, <code>/resume</code>, <code>/cancel N</code>.</p>
    </div>
  );
}

function Tasks({ tick, me, onOpenTask }: { tick: number; me: Me; onOpenTask: (id: number) => void }) {
  const { toast } = useUi();
  const [rows, setRows] = useState<Task[]>([]); const [f, setF] = useState("");
  useEffect(() => { api<Task[]>(`/tasks?limit=100${f ? `&status=${f}` : ""}`).then(setRows); }, [tick, f]);
  const cancel = async (id: number) => { try { const r = await api(`/tasks/${id}/cancel`, { body: {} }); toast(r.ok ? `#${id} отменена` : "Нельзя отменить", r.ok ? "ok" : "err"); } catch (e: any) { toast(e.message, "err"); } };
  return (
    <div>
      <select value={f} onChange={(e) => setF(e.target.value)}>
        <option value="">все</option>{["running", "queued", "awaiting_approval", "succeeded", "failed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <ul className="tasks">
        {rows.map((t) => (
          <li key={t.id}>
            <div onClick={() => onOpenTask(t.id)} className="clickable">
              <Badge s={t.status} /> <b>#{t.id}</b> <span className="tag">{t.agent}</span>{t.mode === "write" && <span className="tag warn">write</span>}
              <div className="small">{t.prompt.slice(0, 120)}</div>
              <div className="muted small">{ago(t.created_at)} · бюджет {fmtUsd(t.max_budget_usd)} · расход {fmtUsd(t.cost_usd)}{t.source === "voice" ? " · 🎤" : ""}</div>
            </div>
            {["running", "queued", "awaiting_approval"].includes(t.status) && me.perms.includes("task.cancel_own") &&
              <button className="ghost small" onClick={() => cancel(t.id)}>Отменить</button>}
          </li>
        ))}
        {!rows.length && <li className="muted">Задач нет</li>}
      </ul>
    </div>
  );
}

function Approvals({ tick, canApprove, refresh }: { tick: number; canApprove: boolean; refresh: () => void }) {
  const { ask, toast } = useUi();
  const [rows, setRows] = useState<Approval[]>([]);
  useEffect(() => { api<Approval[]>("/approvals").then(setRows); }, [tick]);
  const decide = async (id: number, approve: boolean) => {
    try {
      const r = await withConfirm((pw) => api(`/approvals/${id}`, { body: { approve, confirm_password: pw } }), ask);
      if (r) { toast(approve ? "Одобрено" : "Отклонено"); refresh(); }
    } catch (e: any) { toast(e.message, "err"); }
  };
  return (
    <ul className="tasks">
      {rows.map((a) => (
        <li key={a.id}>
          <div><b>#{a.task?.id}</b> <span className="tag">{a.task?.agent}</span> от {a.requested_by_name} · {ago(a.ts)}
            <div className="small">{a.task?.prompt}</div><div className="note small">{a.reason}</div></div>
          {canApprove && <div className="row"><button className="primary small" onClick={() => decide(a.id, true)}>Одобрить</button>
            <button className="ghost small" onClick={() => decide(a.id, false)}>Отклонить</button></div>}
        </li>
      ))}
      {!rows.length && <li className="muted">Нет операций, ожидающих подтверждения</li>}
    </ul>
  );
}

const FIELDS: [keyof Limits, string, number][] = [
  ["max_parallel_tasks", "Параллельных задач (макс.)", 1], ["default_task_budget_usd", "Бюджет задачи по умолчанию, $", 0.05],
  ["approval_threshold_usd", "Порог подтверждения, $", 0.05], ["hard_task_cap_usd", "Жёсткий потолок задачи, $", 0.05],
  ["daily_budget_usd", "Дневной лимит, $", 0.5], ["monthly_budget_usd", "Месячный лимит, $", 1],
];

function LimitsTab({ limits, canEdit, canResume, refresh }: { limits: Limits | null; canEdit: boolean; canResume: boolean; refresh: () => void }) {
  const { ask, toast } = useUi();
  const [v, setV] = useState<Record<string, number>>({});
  useEffect(() => { if (limits) setV(Object.fromEntries(FIELDS.map(([k]) => [k, limits[k] as number]))); }, [limits]);
  if (!limits) return null;
  const save = async (e: FormEvent) => {
    e.preventDefault();
    try { const r = await withConfirm((pw) => api("/limits", { method: "PUT", body: { ...v, confirm_password: pw } }), ask); if (r) { toast("Лимиты сохранены"); refresh(); } }
    catch (err: any) { toast(err.message, "err"); }
  };
  const resume = async () => {
    try { const r = await withConfirm((pw) => api("/resume", { body: { confirm_password: pw } }), ask); if (r) { toast("Очередь возобновлена"); refresh(); } }
    catch (err: any) { toast(err.message, "err"); }
  };
  return (
    <form onSubmit={save} className="limits">
      <p className="small">Потрачено: сегодня <b>{fmtUsd(limits.spent_today_usd)}</b>, в этом месяце <b>{fmtUsd(limits.spent_month_usd)}</b>. Каждая задача передаётся в Claude Code с <code>--max-budget-usd</code>; задача не стартует, если превысит дневной или месячный лимит.</p>
      {FIELDS.map(([k, label, step]) => (
        <label key={k}>{label}<input type="number" step={step} min={step} value={v[k] ?? ""} disabled={!canEdit}
          onChange={(e) => setV({ ...v, [k]: Number(e.target.value) })} /></label>
      ))}
      <div className="row">
        {canEdit && <button className="primary">Сохранить (нужен пароль)</button>}
        {limits.queue_paused && canResume && <button type="button" className="danger" onClick={resume}>Возобновить очередь</button>}
      </div>
    </form>
  );
}

function Costs({ tick }: { tick: number }) {
  const [s, setS] = useState<any>(null);
  useEffect(() => { api("/stats").then(setS); }, [tick]);
  if (!s) return null;
  const max = Math.max(0.0001, ...s.cost_by_day.map((r: any) => r.usd));
  return (
    <div>
      <h4>Расходы по дням</h4>
      <div className="bars">{s.cost_by_day.slice().reverse().map((r: any) => (
        <div key={r.day} title={`${r.day}: ${fmtUsd(r.usd)}, запусков ${r.runs}`}><i style={{ height: `${(r.usd / max) * 100}%` }} /><span>{r.day.slice(5)}</span></div>
      ))}{!s.cost_by_day.length && <span className="muted">Пока нет расходов</span>}</div>
      <h4>По агентам</h4>
      <table><tbody>{s.cost_by_agent.map((r: any) => <tr key={r.agent}><td>{r.agent}</td><td>{fmtUsd(r.usd)}</td><td className="muted">{r.runs} запусков</td></tr>)}</tbody></table>
      <h4>Последние ошибки</h4>
      <ul className="tasks compact">{s.errors.map((e: any) => <li key={e.id}><span className="tag">{e.agent ?? e.kind}</span> #{e.task_id ?? "—"} {String(e.message).slice(0, 140)} <span className="muted">{ago(e.ts)}</span></li>)}
        {!s.errors.length && <li className="muted">Ошибок нет</li>}</ul>
    </div>
  );
}

function Audit({ tick }: { tick: number }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api("/audit?limit=200").then(setRows); }, [tick]);
  return (
    <table className="audit"><thead><tr><th>Время</th><th>Кто</th><th>Действие</th><th>Объект</th></tr></thead>
      <tbody>{rows.map((r) => (
        <tr key={r.id} className={r.ok ? "" : "bad"}><td>{new Date(r.ts * 1000).toLocaleString("ru-RU")}</td><td>{r.username ?? "—"}</td>
          <td>{r.action}</td><td title={r.detail ?? ""}>{r.target ?? ""}</td></tr>
      ))}</tbody></table>
  );
}

function Users() {
  const { ask, toast } = useUi();
  const [rows, setRows] = useState<any[]>([]); const [u, setU] = useState(""); const [p, setP] = useState(""); const [role, setRole] = useState("operator");
  const load = () => api("/users").then(setRows);
  useEffect(() => { load(); }, []);
  const add = async (e: FormEvent) => {
    e.preventDefault();
    try { const r = await withConfirm((pw) => api("/users", { body: { username: u, password: p, role, confirm_password: pw } }), ask); if (r) { toast(`Пользователь ${u} создан`); setU(""); setP(""); load(); } }
    catch (err: any) { toast(err.message, "err"); }
  };
  return (
    <div>
      <table><tbody>{rows.map((r) => <tr key={r.id}><td>{r.username}</td><td><span className="tag">{r.role}</span></td></tr>)}</tbody></table>
      <p className="small muted">operator — ставит задачи только на чтение (запись и крупный бюджет идут на подтверждение владельцу) и может нажать СТОП; viewer — только просмотр.</p>
      <form onSubmit={add} className="row wrap">
        <input placeholder="имя" value={u} onChange={(e) => setU(e.target.value)} autoCapitalize="none" />
        <input type="password" placeholder="пароль (10+)" value={p} onChange={(e) => setP(e.target.value)} autoComplete="new-password" />
        <select value={role} onChange={(e) => setRole(e.target.value)}><option value="operator">operator</option><option value="viewer">viewer</option></select>
        <button className="primary small" disabled={!u || p.length < 10}>Добавить</button>
      </form>
    </div>
  );
}

const RT_INFO: Record<string, string> = {
  claude: "Claude Code CLI с агентами библиотеки (платный API, лимит --max-budget-usd)",
  dry: "без модели — для демонстрации и тестов (события помечаются как симуляция)",
  ollama: "агент библиотеки отвечает локальной моделью Ollama (бесплатно, данные не уходят с компьютера)",
  langgraph: "граф LangGraph: план → специалисты → проверка JARVIS",
  camel: "CAMEL: диалог координатора JARVIS и специалиста",
  browser_use: "browser-use управляет локальным Chromium (действует в интернете — нужно подтверждение)",
  openhands: "OpenHands agent-server: кодовый агент выполняет команды в проекте (нужно подтверждение)",
};

function Integrations({ tick }: { tick: number }) {
  const [r, setR] = useState<any>(null);
  useEffect(() => { api("/runtimes").then(setR).catch(() => {}); }, [tick]);
  if (!r) return null;
  return (
    <div>
      <p className="small">LLM-сервер: <code>{r.llm_base_url}</code> {r.llm_local ? "(локальный — бесплатно)" : "(внешний — платно, расход не отслеживается)"} ·
        исполнитель по умолчанию: <b>{r.default}</b>. Выбор — в командной строке или префиксом <code>#ollama</code>, <code>#langgraph</code>…</p>
      <ul className="tasks">
        {r.runtimes.map((x: any) => (
          <li key={x.id}>
            <div>
              <span className={`badge ${x.ready ? "st-succeeded" : "st-failed"}`}>{x.ready ? "готов" : "не готов"}</span> <b>{x.label}</b>
              {x.paid && <span className="tag warn">платно</span>}{x.critical && <span className="tag warn">подтверждение</span>}
              <div className="small muted">{RT_INFO[x.id]}{x.llm ? ` · модель ${x.llm}` : ""}</div>
              {x.problems.map((p: string) => <div key={p} className="small note">⚠️ {p}</div>)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
