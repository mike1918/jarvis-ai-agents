import { useEffect, useMemo, useRef, useState } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BUILDINGS, DISTRICTS, type BuildingSpec } from "./plan";
import { box, labelTexture, mats, mergeParts, rng, translateParts, type Part } from "./kit";
import { building, tree } from "./builders";
import { buildLayout, floorH, Interior } from "./Interior";
import { TowerExterior } from "./Tower";
import { useWorld } from "./store";
import { sim } from "./sim";

export function agentsOf(b: BuildingSpec, folders: Record<string, string[]>) {
  return (b.folders ?? []).flatMap((f) => folders[f] ?? []);
}

/** Main functional buildings: exterior → cutaway → interior. */
export function MainBuildings({ folders, paused, running, low }: { folders: Record<string, string[]>; paused: boolean; running: number; low: boolean }) {
  const open = useWorld((s) => s.building), view = useWorld((s) => s.view), floor = useWorld((s) => s.floor), room = useWorld((s) => s.room);
  const agent = useWorld((s) => s.agent), states = useWorld((s) => s.states);
  const openBuilding = useWorld((s) => s.openBuilding), fly = useWorld((s) => s.fly), enterRoom = useWorld((s) => s.enterRoom), setFloor = useWorld((s) => s.setFloor);
  const openSpec = BUILDINGS.find((b) => b.id === open) ?? null;
  const layout = useMemo(() => (openSpec ? buildLayout(openSpec, agentsOf(openSpec, folders)) : null), [openSpec, folders]);

  // camera follows the navigation state
  useEffect(() => {
    if (!openSpec || view === "city") return;
    const H = floorH(openSpec), size = openSpec.kind === "tower" ? 30 : Math.max(openSpec.w, openSpec.d);
    if (agent && layout) {
      const s = layout.seats.find((x) => x.agent === agent);
      if (s && floor !== s.floor) { setFloor(s.floor); useWorld.setState({ agent }); return; }    // open the agent's floor (upper floors hidden)
      if (s) return fly({ target: [openSpec.x + s.seat.x, s.floor * H + 1.2, openSpec.z + s.seat.z], dist: 9, polar: 0.9 });
    }
    if (view === "interior" && room && layout) {
      const r = layout.floors[floor]?.rooms.find((x) => x.id === room);
      if (r) return fly({ target: [openSpec.x + r.x + r.w / 2, floor * H + 0.8, openSpec.z + r.z + r.d / 2], dist: Math.max(r.w, r.d) * 0.95 + 4, polar: 0.92 });
    }
    if (floor >= 0) return fly({ target: [openSpec.x, floor * H + 1, openSpec.z], dist: size * 1.25 + 6, polar: 0.82 });
    fly({ target: [openSpec.x, ((openSpec.interior?.length ?? 1) * H) / 2, openSpec.z], dist: size * 1.9 + 24, polar: 0.98 });
  }, [openSpec, view, floor, room, agent, layout, fly, setFloor]);

  return (
    <group>
      {BUILDINGS.map((b) => {
        const isOpen = open === b.id && view !== "city";
        const ags = agentsOf(b, folders), working = ags.filter((a) => ["working", "reviewing"].includes(states[a]?.state)).length;
        if (b.kind === "tower") return isOpen ? <PlazaBase key={b.id} /> : (
          <TowerShell key={b.id} onOpen={() => openBuilding(b.id)} paused={paused} running={running} />
        );
        return isOpen ? null : <Exterior key={b.id} b={b} agents={ags.length} working={working} low={low} showLabel={view === "city"} onOpen={() => openBuilding(b.id)} />;
      })}
      {openSpec && layout && view !== "city" && (
        <Interior b={openSpec} layout={layout} onRoom={(id, f) => { if (f !== floor) setFloor(f); enterRoom(id); }} />
      )}
    </group>
  );
}

function TowerShell({ onOpen, paused, running }: { onOpen: () => void; paused: boolean; running: number }) {
  const [hover, setHover] = useState(false);
  return <TowerExterior onOpen={onOpen} hover={hover} setHover={setHover} paused={paused} running={running} />;
}

function PlazaBase() {
  return <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]} material={mats().paver}><circleGeometry args={[48, 48]} /></mesh>;
}

function Exterior({ b, agents, working, onOpen, low, showLabel }: { b: BuildingSpec; agents: number; working: number; onOpen: () => void; low: boolean; showLabel: boolean }) {
  const merged = useMemo(() => {
    const r = rng(b.id.length * 131 + Math.round(b.x)), parts: Part[] = translateParts(building(b.kind, b.w, b.d, b.floors, b.id.length * 97), b.x, 0, b.z);
    // site: parking with parked cars, trees along the plot edge
    const px = b.x - b.w / 2 - 2, pz = b.z + b.d / 2 + 6;
    parts.push(box(b.w * 0.6, 0.05, 6, b.x + b.w * 0.2, 0.03, pz, "asphalt"));
    for (let i = 0; i < Math.floor(b.w * 0.6 / 3); i++) {
      parts.push(box(0.15, 0.02, 5, b.x - b.w * 0.1 + i * 3, 0.07, pz, "white"));
      if (r() > 0.35) parts.push(box(1.8, 1.3, 4.2, b.x - b.w * 0.1 + i * 3 + 1.5, 0.05, pz, (["red", "white", "darkMetal", "metal"] as const)[Math.floor(r() * 4)]));
    }
    for (let z = b.z - b.d / 2; z < b.z + b.d / 2; z += 6) parts.push(...tree(px, z, r));
    return mergeParts(parts);
  }, [b]);
  const [hover, setHover] = useState(false);
  const ring = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(() => { if (ring.current) ring.current.opacity = working ? 0.45 + Math.sin(sim.t * 4) * 0.35 : hover ? 0.8 : 0; });
  const color = DISTRICTS[b.district].color;
  const label = labelTexture([b.name, agents ? `${agents} агентов${working ? ` · работают ${working}` : ""}` : "нет агентов (резерв)"], working ? "#fde68a" : color);
  const H = b.floors * floorH(b) + 6;
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onOpen(); };
  return (
    <group>
      <group onClick={click} onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}>
        {merged.map(({ m, g }) => <mesh key={m} geometry={g} material={mats()[m]} castShadow={!low && m !== "asphalt" && m !== "white"} receiveShadow />)}
      </group>
      <mesh rotation-x={-Math.PI / 2} position={[b.x, 0.12, b.z]}>
        <ringGeometry args={[Math.max(b.w, b.d) / 2 + 3, Math.max(b.w, b.d) / 2 + 4.5, 48]} />
        <meshBasicMaterial ref={ring} color={working ? "#fbbf24" : "#7dd3fc"} transparent opacity={0} toneMapped={false} />
      </mesh>
      {showLabel && <sprite position={[b.x, H + 8, b.z]} scale={[8 * (label.userData.aspect ?? 3), 8, 1]} onClick={click}>
        <spriteMaterial map={label} depthTest={false} />
      </sprite>}
    </group>
  );
}
