import { useEffect } from "react";
import { ThreeEvent } from "@react-three/fiber";
import { type BuildingSpec, type RoomSpec } from "./plan";
import { labelTexture, mats } from "./kit";
import { floorH, type Layout } from "./layout";
export { buildLayout, fitRooms, floorH } from "./layout";
import { AgentFigure, Prop, Staff } from "./People";
import { useWorld } from "./store";

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
