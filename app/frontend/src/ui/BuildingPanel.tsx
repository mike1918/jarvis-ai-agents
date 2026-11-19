import { BUILDINGS, DISTRICTS } from "../world/plan";
import { fitRooms } from "../world/Interior";
import { agentsOf } from "../world/MainBuildings";
import { STATE_COLOR, STATE_RU } from "../world/People";
import { useWorld } from "../world/store";

/** Navigation inside an open building: Exterior / Cutaway / Interior, floors, rooms, agents (with live server state). */
export default function BuildingPanel({ folders }: { folders: Record<string, string[]> }) {
  const id = useWorld((s) => s.building), view = useWorld((s) => s.view), floor = useWorld((s) => s.floor), room = useWorld((s) => s.room);
  const states = useWorld((s) => s.states), agent = useWorld((s) => s.agent);
  const { setFloor, enterRoom, home, selectAgent, showTower } = useWorld.getState();
  const b = BUILDINGS.find((x) => x.id === id);
  if (!b || view === "city") return null;
  const floors = b.interior ?? [];
  const rooms = floor >= 0 && floors[floor] ? fitRooms(floors[floor], b.kind === "tower" ? 28 : b.w, b.kind === "tower" ? 28 : b.d) : [];
  const ags = agentsOf(b, folders);
  const counts = ags.reduce<Record<string, number>>((a, n) => { const s = states[n]?.state ?? "idle"; a[s] = (a[s] ?? 0) + 1; return a; }, {});
  return (
    <aside className="panel bpanel">
      <div className="panel-head">
        <div>
          <div className="eyebrow" style={{ color: DISTRICTS[b.district].color }}>{DISTRICTS[b.district].name}</div>
          <h2>{b.name}</h2>
          <div className="muted small">{ags.length ? `${ags.length} агентов` : "агенты не назначены"} · {floors.length} этажей · {b.folders?.join(", ")}</div>
        </div>
        <button className="ghost close" onClick={home} aria-label="Закрыть здание">✕</button>
      </div>
      <div className="seg">
        <button onClick={home}>Экстерьер</button>
        <button className={view === "cutaway" ? "on" : ""} onClick={() => enterRoom(null)}>Разрез</button>
        <button className={view === "interior" ? "on" : ""} disabled={!rooms.length} onClick={() => rooms[0] && enterRoom(room ?? rooms[0].id)}>Помещение</button>
      </div>
      <div className="floors">
        <button className={floor < 0 ? "on" : ""} onClick={() => setFloor(-1)}>Все этажи</button>
        {floors.map((f, i) => <button key={i} className={floor === i ? "on" : ""} onClick={() => setFloor(i)} title={`клавиша ${i + 1}`}>{i + 1}. {f.name}</button>)}
      </div>
      {rooms.length > 0 && (
        <div className="rooms">
          {rooms.map((r) => (
            <button key={r.id} className={room === r.id ? "on" : ""} onClick={() => { enterRoom(r.id); if (r.kind === "owner") showTower(true); }}>
              {r.name}{r.kind === "owner" ? " — панель управления" : ""}
            </button>
          ))}
        </div>
      )}
      {ags.length > 0 && (
        <>
          <div className="state-legend">{Object.entries(counts).map(([s, n]) => <span key={s}><i style={{ background: STATE_COLOR[s as keyof typeof STATE_COLOR] }} />{STATE_RU[s as keyof typeof STATE_RU]}: {n}</span>)}</div>
          <ul className="agents">
            {ags.map((n) => {
              const s = states[n]?.state ?? "idle";
              return <li key={n}><button className={`agent-row ${agent === n ? "on" : ""}`} onClick={() => selectAgent(n)}>
                <span className="state" style={{ background: STATE_COLOR[s] }} /><span className="name">{n}</span><span className="tag">{STATE_RU[s]}</span>
              </button></li>;
            })}
          </ul>
        </>
      )}
      <p className="muted small">Персонажи с цветным кольцом — агенты библиотеки, их состояние берётся с сервера. Серые фигуры без бейджа — декоративный персонал.</p>
    </aside>
  );
}
