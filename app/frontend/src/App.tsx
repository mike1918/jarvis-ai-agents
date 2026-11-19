import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { District, Limits, Me } from "./types";
import { UiProvider, useUi } from "./ui/common";
import Login from "./ui/Login";
import TopBar from "./ui/TopBar";
import CommandBar from "./ui/CommandBar";
import TowerPanel from "./ui/TowerPanel";
import TaskDetail from "./ui/TaskDetail";
import BuildingPanel from "./ui/BuildingPanel";
import AgentCard from "./ui/AgentCard";
import ViewControls from "./ui/ViewControls";
import { useTopbarHeight } from "./ui/useTopbarHeight";
import { useWorld } from "./world/store";
import { BUILDINGS, DISTRICTS } from "./world/plan";

const Scene = lazy(() => import("./world/Scene"));
const isMobile = () => window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;

function City({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const { toast } = useUi();
  const [folders, setFolders] = useState<Record<string, string[]>>({});
  const [taskId, setTaskId] = useState<number | null>(null);
  const [prefill, setPrefill] = useState("");
  const [tick, setTick] = useState(0);
  const [mobile] = useState(isMobile);
  useTopbarHeight();
  const limits = useWorld((s) => s.limits), view = useWorld((s) => s.view), agent = useWorld((s) => s.agent), tower = useWorld((s) => s.tower);
  const refresh = useCallback(() => {
    const w = useWorld.getState();
    w.syncStates().catch(() => {});
    api<Limits>("/limits").then(w.setLimits).catch(() => {});
    setTick((t) => t + 1);
  }, []);
  useEffect(() => {
    api<District[]>("/districts").then((ds) => setFolders(Object.fromEntries(ds.map((d) => [d.folder, d.agents])))).catch(() => {});
    refresh();                                        // state is restored from the server after every reload
    const poll = setInterval(refresh, 10000);
    const es = new EventSource("/api/events");
    let pending = false;
    es.onmessage = (m) => {
      const ev = JSON.parse(m.data);
      if (ev.kind === "event") {
        useWorld.getState().applyEvent(ev);
        if (ev.type === "task.completed") toast(`Задача #${ev.task_id} выполнена (${ev.agent})`);
        if (ev.type === "task.failed" && ev.status === "failed") toast(`Задача #${ev.task_id}: ошибка (${ev.agent})`, "err");
        if (ev.type === "approval.requested") toast(`Задача #${ev.task_id} ждёт подтверждения владельца`);
        if (ev.type === "budget.threshold_reached") toast(`Бюджет: потрачено ${Math.round(ev.data.level * 100)}% дневного лимита`, "err");
      }
      if (!pending) { pending = true; setTimeout(() => { pending = false; refresh(); }, 350); }
    };
    es.onerror = () => {};                             // EventSource reconnects by itself; the poll keeps state fresh
    return () => { clearInterval(poll); es.close(); };
  }, [refresh, toast]);
  const assign = (a: string) => setPrefill(`@${a} `);
  const counts = Object.values(useWorld.getState().states).reduce((n, s) => n + (["working", "reviewing"].includes(s.state) ? 1 : 0), 0);
  return (
    <div className={`app ${mobile ? "mobile" : ""}`}>
      <Suspense fallback={<div className="loading">Строим Ашдод…</div>}>
        <Scene folders={folders} paused={!!limits?.queue_paused} running={limits?.running ?? 0} low={mobile} />
      </Suspense>
      <TopBar me={me} limits={limits} onTower={() => useWorld.getState().showTower(true)} onLogout={onLogout} />
      <ViewControls />
      {view === "city" && !agent && !tower && (
        <div className="legend">
          <b>JARVIS AI CITY · Ашдод</b>
          <span>Нажмите на здание: камера подлетит, крыша и фасад откроются в разрез. Выберите этаж, комнату и агента. Работают сейчас: {counts}.</span>
          <div className="chips">{BUILDINGS.map((b) => (
            <button key={b.id} style={{ borderColor: DISTRICTS[b.district].color }} onClick={() => useWorld.getState().openBuilding(b.id)}>{b.name}</button>
          ))}</div>
        </div>
      )}
      {view !== "city" && !agent && !tower && <BuildingPanel folders={folders} />}
      {agent && <AgentCard tick={tick} onAssign={assign} onOpenTask={setTaskId} perms={me.perms} />}
      {tower && <TowerPanel me={me} limits={limits} tick={tick} onClose={() => useWorld.getState().showTower(false)} onOpenTask={setTaskId} refresh={refresh} />}
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
  return <UiProvider>{me ? <City me={me} onLogout={logout} /> : <Login ownerExists={health.owner_exists} onDone={setMe} />}</UiProvider>;
}
