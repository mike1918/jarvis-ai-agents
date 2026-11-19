import { useEffect, useState } from "react";
import { api, fmtUsd } from "../api";
import { sim } from "../city/env";
import { fmtClock } from "../sim/clock";
import type { Limits, Me } from "../types";
import { useUi } from "./common";

const SPEEDS = [{ v: 0, l: "⏸" }, { v: 60, l: "×60" }, { v: 600, l: "×600" }, { v: 3600, l: "×3600" }];

export default function TopBar({ me, limits, onTower, onLogout }: { me: Me; limits: Limits | null; onTower: () => void; onLogout: () => void }) {
  const { toast } = useUi();
  const [clock, setClock] = useState(fmtClock(sim.hours));
  const [, force] = useState(0);
  useEffect(() => { const t = setInterval(() => setClock(fmtClock(sim.hours)), 250); return () => clearInterval(t); }, []);
  const setSpeed = (v: number) => { sim.live = false; sim.paused = v === 0; if (v) sim.speed = v; force((x) => x + 1); };
  const live = () => { sim.live = true; sim.paused = false; force((x) => x + 1); };
  const jump = (h: number) => { sim.live = false; sim.hours = h; force((x) => x + 1); };
  async function stop() {
    if (!confirm("Остановить очередь и прервать все работающие агенты?")) return;
    try { const r = await api("/killswitch", { body: {} }); toast(`Остановлено. Прервано процессов: ${r.stopped_running}`); }
    catch (e: any) { toast(e.message, "err"); }
  }
  const day = sim.sun.day > 0.5;
  return (
    <header className="topbar">
      <button className="brand-btn" onClick={onTower} title="Башня JARVIS — панель управления">
        <span className="dot" data-paused={limits?.queue_paused ? 1 : 0} /> JARVIS <small>ASHDOD 4D</small>
      </button>
      <div className="clock" title="Время симуляции (Asia/Jerusalem)">
        <span>{day ? "☀️" : "🌙"} {clock}</span>
        <div className="speeds">
          {SPEEDS.map((s) => (
            <button key={s.v} className={!sim.live && ((s.v === 0 && sim.paused) || (!sim.paused && sim.speed === s.v)) ? "on" : ""} onClick={() => setSpeed(s.v)}>{s.l}</button>
          ))}
          <button className={sim.live ? "on" : ""} onClick={live} title="Реальное время Ашдода">LIVE</button>
          <button onClick={() => jump(12)} title="Полдень">12:00</button>
          <button onClick={() => jump(17.7)} title="Закат над морем">🌅</button>
          <button onClick={() => jump(23)} title="Ночь">23:00</button>
        </div>
      </div>
      <div className="stats">
        {limits && <>
          {limits.executor === "dry" && <span className="badge dry" title="Задачи не вызывают Claude API">DRY RUN</span>}
          <span title="Расход сегодня / дневной лимит">💰 {fmtUsd(limits.spent_today_usd)} / {fmtUsd(limits.daily_budget_usd)}</span>
          <span title="Выполняется / максимум параллельно">⚙️ {limits.running}/{limits.max_parallel_tasks}</span>
          {limits.queue_paused && <span className="badge st-failed">очередь на паузе</span>}
        </>}
      </div>
      <div className="actions">
        {me.perms.includes("stop") && <button className="danger stop" onClick={stop} title="Аварийная остановка всех агентов">■ СТОП</button>}
        <button className="ghost" onClick={onLogout} title={`${me.username} (${me.role})`}>⎋</button>
      </div>
    </header>
  );
}
