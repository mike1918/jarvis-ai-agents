import { useEffect } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { FLOOR_H, type BuildingSpec, type FloorSpec, type RoomSpec } from "./plan";
import { box, labelTexture, mats, mergeParts, type Part } from "./kit";
import { furnish, type Seat } from "./furniture";
import { AgentFigure, Prop, Staff } from "./People";
import { useWorld } from "./store";

export const floorH = (b: BuildingSpec) => (b.kind === "tower" ? 5.2 : FLOOR_H);
const AGENT_ROOMS = new Set(["office", "control", "lab", "robotics", "ai-core", "reception", "security-ops"]);

/** Fit a floor's rooms into the building footprint (templates are authored in approximate local units). */
export function fitRooms(f: FloorSpec, w: number, d: number): RoomSpec[] {
  const x0 = Math.min(...f.rooms.map((r) => r.x)), x1 = Math.max(...f.rooms.map((r) => r.x + r.w));
  const z0 = Math.min(...f.rooms.map((r) => r.z)), z1 = Math.max(...f.rooms.map((r) => r.z + r.d));
  const sx = (w - 1) / (x1 - x0), sz = (d - 1) / (z1 - z0);
  return f.rooms.map((r) => ({ ...r, x: -w / 2 + 0.5 + (r.x - x0) * sx, z: -d / 2 + 0.5 + (r.z - z0) * sz, w: r.w * sx, d: r.d * sz }));
}

export interface Layout {
  floors: { rooms: RoomSpec[]; merged: ReturnType<typeof mergeParts>; anims: ReturnType<typeof furnish>["anims"]; staff: Seat[] }[];
  seats: { agent: string; floor: number; room: string; seat: Seat; door: [number, number] }[];
}

/** Workplace layout for a building: furniture per room and a desk per library agent working here (by agent id). */
export function buildLayout(b: BuildingSpec, agents: string[]): Layout {
  const w = b.kind === "tower" ? 28 : b.w, d = b.kind === "tower" ? 28 : b.d;
  const floors: Layout["floors"] = [];
  const free: { floor: number; room: string; seat: Seat; door: [number, number] }[][] = [];
  (b.interior ?? []).forEach((f, fi) => {
    const rooms = fitRooms(f, w, d), parts: Part[] = [];
    const anims: Layout["floors"][number]["anims"] = [], staff: Seat[] = [];
    parts.push(box(w, 0.3, d, 0, 0, 0, "white"));                                                        // slab
    parts.push(box(w, floorH(b) - 0.3, 0.3, 0, 0.3, -d / 2 + 0.15, b.kind === "factory" ? "brick" : "concrete", FLOOR_H));   // back wall
    parts.push(box(0.3, floorH(b) - 0.3, d, -w / 2 + 0.15, 0.3, 0, b.kind === "factory" ? "brick" : "concrete", FLOOR_H));    // left wall
    parts.push(box(w, 1, 0.08, 0, 0.3, d / 2 - 0.05, "glassClear"), box(0.08, 1, d, w / 2 - 0.05, 0.3, 0, "glassClear"));   // cut-edge railings
    for (const r of rooms) {
      const f2 = furnish(r, fi * 100 + r.id.length * 7 + Math.round(r.x));
      parts.push(...f2.parts); anims.push(...f2.anims); staff.push(...f2.staff);
      if (r.x + r.w < w / 2 - 0.6) parts.push(box(0.08, 2.8, r.d, r.x + r.w, 0.3, r.z + r.d / 2, "glassClear"));   // partitions
      if (r.z + r.d < d / 2 - 0.6) parts.push(box(r.w, 2.8, 0.08, r.x + r.w / 2, 0.3, r.z + r.d, "glassClear"));
      parts.push(box(r.w * 0.6, 0.06, 0.25, r.x + r.w / 2, floorH(b) - 0.2, r.z + r.d / 2, "warmLight"));          // ceiling light
      if (AGENT_ROOMS.has(r.kind)) free.push(f2.seats.map((s) => ({ floor: fi, room: r.id, seat: s, door: [r.x + r.w - 0.8, r.z + r.d - 0.6] as [number, number] })));
    }
    floors.push({ rooms, merged: mergeParts(parts), anims, staff });
  });
  // round-robin agents over agent rooms so every working floor is staffed; the coordinator sits in the command centre first
  const seats: Layout["seats"] = [];
  const order = [...agents].sort((a, b) => (a === "jarvis" ? -1 : b === "jarvis" ? 1 : a.localeCompare(b)));
  const cmd = b.kind === "tower" ? free.findIndex((list) => list[0]?.room === "t-cmd") : -1;
  order.forEach((name, i) => {
    const pools = free.filter((l) => l.length);
    if (!pools.length) return;
    const pool = name === "jarvis" && cmd >= 0 && free[cmd].length ? free[cmd] : pools[i % pools.length];
    const s = pool.shift()!; seats.push({ agent: name, ...s });
  });
  return { floors, seats };
}

/** Cutaway / interior rendering of one open building. Built on demand and disposed when the building is closed. */
export function Interior({ b, layout, onRoom }: { b: BuildingSpec; layout: Layout; onRoom: (id: string, floor: number) => void }) {
  const floor = useWorld((s) => s.floor), view = useWorld((s) => s.view), room = useWorld((s) => s.room);
  const states = useWorld((s) => s.states), agent = useWorld((s) => s.agent), selectAgent = useWorld((s) => s.selectAgent);
  useEffect(() => () => layout.floors.forEach((f) => f.merged.forEach(({ g }) => g.dispose())), [layout]);   // free GPU memory on close
  const H = floorH(b);
  return (
    <group position={[b.x, 0, b.z]} rotation-y={b.rot ?? 0}>
      <ambientLight intensity={0.55} />
      <pointLight position={[0, (Math.max(floor, 0) + 0.85) * H, 0]} intensity={180} distance={Math.max(b.w, b.d) * 1.6} decay={1.6} color="#ffe6c4" />
      {layout.floors.map((f, fi) => {
        const visible = floor < 0 || fi <= floor;
        if (!visible || (view === "interior" && fi !== floor)) return null;
        const focused = floor === fi;
        return (
          <group key={fi} position={[0, fi * H, 0]}>
            {f.merged.map(({ m, g }) => <mesh key={m} geometry={g} material={mats()[m]} castShadow={false} receiveShadow />)}
            {f.anims.map((a, i) => <Prop key={i} a={a} />)}
            {f.staff.map((s, i) => <Staff key={i} seat={s} i={i} />)}
            {layout.seats.filter((s) => s.floor === fi).map((s) => (
              <AgentFigure key={s.agent} name={s.agent} seat={s.seat} door={s.door} state={states[s.agent]?.state ?? "idle"} runtime={states[s.agent]?.runtime}
                color={b.kind === "tower" ? "#0ea5e9" : "#1d4ed8"} selected={agent === s.agent} onSelect={selectAgent} />
            ))}
            {focused && f.rooms.map((r) => (
              <group key={r.id}>
                <mesh position={[r.x + r.w / 2, 0.36, r.z + r.d / 2]} rotation-x={-Math.PI / 2}
                  onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onRoom(r.id, fi); }}>
                  <planeGeometry args={[r.w - 0.2, r.d - 0.2]} />
                  <meshBasicMaterial color="#38bdf8" transparent opacity={room === r.id ? 0.12 : 0.0} depthWrite={false} />
                </mesh>
                {view !== "interior" && <RoomLabel r={r} y={H - 0.4} />}
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}

function RoomLabel({ r, y }: { r: RoomSpec; y: number }) {
  const t = labelTexture([r.name], "#e2f3ff");
  return <sprite position={[r.x + r.w / 2, y + 1.2, r.z + r.d / 2]} scale={[0.9 * (t.userData.aspect ?? 3), 0.9, 1]}><spriteMaterial map={t} depthTest={false} /></sprite>;
}
