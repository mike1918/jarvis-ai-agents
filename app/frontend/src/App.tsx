import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { District, Limits, Me } from "./types";
import { UiProvider, useUi } from "./ui/common";
import Login from "./ui/Login";
import TopBar from "./ui/TopBar";
import CommandBar from "./ui/CommandBar";
import DistrictPanel from "./ui/DistrictPanel";
import TowerPanel from "./ui/TowerPanel";
import TaskDetail from "./ui/TaskDetail";

const CityScene = lazy(() => import("./city/CityScene"));
const isMobile = () => window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;

function City({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const { toast } = useUi();
  const [districts, setDistricts] = useState<District[]>([]);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<number | null>(null);
  const [prefill, setPrefill] = useState("");
  const [tick, setTick] = useState(0);
  const [mobile] = useState(isMobile);
  const refresh = useCallback(() => {
    api<District[]>("/districts").then(setDistricts).catch(() => {});
    api<Limits>("/limits").then(setLimits).catch(() => {});
    setTick((t) => t + 1);
  }, []);
  useEffect(() => {
    refresh();
    const poll = setInterval(refresh, 10000);
    const es = new EventSource("/api/events");
    let pending = false;
    es.onmessage = (m) => {
      const ev = JSON.parse(m.data);
      if (ev.kind === "task.status" && ["succeeded", "failed"].includes(ev.status))
        toast(`Задача #${ev.task_id}: ${ev.status === "succeeded" ? "готово" : "ошибка"}`, ev.status === "succeeded" ? "ok" : "err");
      if (!pending) { pending = true; setTimeout(() => { pending = false; refresh(); }, 400); }
    };
    return () => { clearInterval(poll); es.close(); };
  }, [refresh, toast]);
  const assign = (agent: string) => setPrefill(`@${agent} `);
  return (
    <div className={`app ${mobile ? "mobile" : ""}`}>
      <Suspense fallback={<div className="loading">Строим Ашдод…</div>}>
        <CityScene districts={districts} selected={selected} onSelect={setSelected} paused={!!limits?.queue_paused}
          running={limits?.running ?? 0} mobile={mobile} />
      </Suspense>
      <TopBar me={me} limits={limits} onTower={() => setSelected("00-jarvis")} onLogout={onLogout} />
      {selected === "00-jarvis" && <TowerPanel me={me} limits={limits} tick={tick} onClose={() => setSelected(null)} onOpenTask={setTaskId} refresh={refresh} />}
      {selected && selected !== "00-jarvis" && (
        <DistrictPanel folder={selected} tick={tick} onClose={() => setSelected(null)} onAssign={assign} onOpenTask={setTaskId} />
      )}
      {!selected && (
        <div className="legend">
          <b>JARVIS AI CITY · Ашдод</b>
          <span>Нажмите на здание района, чтобы увидеть агентов, или на башню JARVIS — панель управления.</span>
          <div className="chips">{districts.filter((d) => d.folder !== "00-jarvis").map((d) => (
            <button key={d.folder} onClick={() => setSelected(d.folder)} className={d.working ? "busy" : ""}>{d.folder.slice(3)} · {d.count}</button>
          ))}</div>
        </div>
      )}
      <CommandBar prefill={prefill} onResult={refresh} canCommand={me.perms.includes("command")} />
      {taskId !== null && <TaskDetail id={taskId} tick={tick} onClose={() => setTaskId(null)} />}
    </div>
  );
}

export default function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [health, setHealth] = useState<{ owner_exists: boolean } | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    api("/health").then(setHealth).catch((e) => setErr(`Сервер недоступен: ${e.message}`));
    api<Me>("/me").then(setMe).catch(() => {});
  }, []);
  const logout = async () => { try { await api("/logout", { body: {} }); } catch {} setMe(null); setHealth({ owner_exists: true }); };
  if (err) return <div className="login"><div className="card err">{err}</div></div>;
  if (!health) return <div className="loading">Подключение…</div>;
  return (
    <UiProvider>
      {me ? <City me={me} onLogout={logout} /> : <Login ownerExists={health.owner_exists} onDone={setMe} />}
    </UiProvider>
  );
}
