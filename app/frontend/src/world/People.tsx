import { useEffect, useMemo, useRef, useState } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { labelTexture, mats } from "./kit";
import type { Anim, Seat } from "./furniture";
import type { VisualState } from "./store";
import { sim } from "./sim";

export const STATE_COLOR: Record<VisualState, string> = {
  idle: "#64748b", assigned: "#38bdf8", walking: "#38bdf8", working: "#fbbf24", reviewing: "#a78bfa", waiting: "#f59e0b", error: "#ef4444", completed: "#22c55e",
};
export const STATE_RU: Record<VisualState, string> = {
  idle: "свободен", assigned: "получил задачу", walking: "идёт к рабочему месту", working: "работает", reviewing: "проверяет результат",
  waiting: "ждёт подтверждения", error: "ошибка", completed: "завершил задачу",
};
const ICON: Record<VisualState, string> = { idle: "·", assigned: "•", walking: "→", working: "⚙", reviewing: "◎", waiting: "⏳", error: "!", completed: "✓" };

const _icons = new Map<string, THREE.CanvasTexture>();
function iconTex(s: VisualState) {
  if (_icons.has(s)) return _icons.get(s)!;
  const c = document.createElement("canvas"); c.width = c.height = 64; const g = c.getContext("2d")!;
  g.fillStyle = STATE_COLOR[s]; g.beginPath(); g.arc(32, 32, 28, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#0b1220"; g.font = "700 38px system-ui, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(ICON[s], 32, 35);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; _icons.set(s, t); return t;
}

/** Simple low-poly person. `pose`: sit | stand | walk. */
function Body({ shirt, pose, phase, typing }: { shirt: string; pose: "sit" | "stand" | "walk"; phase: number; typing: boolean }) {
  const armL = useRef<THREE.Mesh>(null!), armR = useRef<THREE.Mesh>(null!), legL = useRef<THREE.Mesh>(null!), legR = useRef<THREE.Mesh>(null!);
  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.8 }), [shirt]);
  useEffect(() => () => shirtMat.dispose(), [shirtMat]);
  useFrame(() => {
    const t = sim.t * 6 + phase;
    if (pose === "walk") { legL.current.rotation.x = Math.sin(t) * 0.6; legR.current.rotation.x = -Math.sin(t) * 0.6; armL.current.rotation.x = -Math.sin(t) * 0.5; armR.current.rotation.x = Math.sin(t) * 0.5; }
    else if (typing) { armL.current.rotation.x = -1.2 + Math.sin(t * 2.2) * 0.12; armR.current.rotation.x = -1.2 + Math.cos(t * 2.4) * 0.12; }
    else { armL.current.rotation.x = pose === "sit" ? -0.9 : 0; armR.current.rotation.x = pose === "sit" ? -0.9 : 0; }
  });
  const sit = pose === "sit", hip = sit ? 0.5 : 0.85;
  return (
    <group>
      <mesh ref={legL} position={[-0.12, hip, sit ? 0.15 : 0]} rotation-x={sit ? -1.5 : 0} material={mats().darkMetal}><boxGeometry args={[0.16, 0.8, 0.18]} /></mesh>
      <mesh ref={legR} position={[0.12, hip, sit ? 0.15 : 0]} rotation-x={sit ? -1.5 : 0} material={mats().darkMetal}><boxGeometry args={[0.16, 0.8, 0.18]} /></mesh>
      <mesh position={[0, hip + 0.4, 0]} material={shirtMat}><boxGeometry args={[0.46, 0.62, 0.26]} /></mesh>
      <mesh ref={armL} position={[-0.3, hip + 0.62, 0]} material={shirtMat}><boxGeometry args={[0.12, 0.55, 0.14]} /></mesh>
      <mesh ref={armR} position={[0.3, hip + 0.62, 0]} material={shirtMat}><boxGeometry args={[0.12, 0.55, 0.14]} /></mesh>
      <mesh position={[0, hip + 0.92, 0]}><sphereGeometry args={[0.17, 12, 10]} /><meshStandardMaterial color="#e0b98f" roughness={0.7} /></mesh>
    </group>
  );
}

/** Agent workplace character. Its pose/colour is a consequence of the backend state only. */
export function AgentFigure({ name, seat, door, state, color, selected, onSelect, runtime }:
  { name: string; seat: Seat; door: [number, number]; state: VisualState; color: string; selected: boolean; onSelect: (n: string) => void; runtime?: string | null }) {
  const g = useRef<THREE.Group>(null!), ring = useRef<THREE.MeshBasicMaterial>(null!), screen = useRef<THREE.MeshBasicMaterial>(null!);
  const [hover, setHover] = useState(false);
  const prev = useRef<VisualState>(state);
  const walk = useRef<{ t0: number } | null>(null);
  const [walking, setWalking] = useState(false);
  useEffect(() => {
    // visual transition only: when a task arrives the character walks from the door to the desk (does not delay the real task)
    if ((prev.current === "idle" || prev.current === "completed" || prev.current === "error") && (state === "assigned" || state === "working")) {
      walk.current = { t0: sim.t }; setWalking(true);
    }
    prev.current = state;
  }, [state]);
  useFrame(() => {
    const W = walk.current;
    if (W) {
      const f = Math.min(1, (sim.t - W.t0) / 2.5);
      const x = door[0] + (seat.x - door[0]) * f, z = door[1] + (seat.z - door[1]) * f;
      g.current.position.set(x, 0.34, z); g.current.rotation.y = Math.atan2(seat.x - door[0], seat.z - door[1]);
      if (f >= 1) { walk.current = null; setWalking(false); }
    } else {
      g.current.position.set(seat.x, 0.34, seat.z); g.current.rotation.y = seat.yaw + (state === "reviewing" ? Math.sin(sim.t * 1.5) * 0.5 : 0);
    }
    const pulse = state === "error" || state === "waiting" ? 0.5 + Math.sin(sim.t * 6) * 0.5 : 1;
    ring.current.color.set(STATE_COLOR[walking ? "walking" : state]).multiplyScalar(0.4 + pulse * 0.6);
    screen.current.color.set(state === "working" ? (Math.sin(sim.t * 9) > 0 ? "#7dd3fc" : "#38bdf8") : state === "error" ? "#ef4444" : state === "idle" ? "#1e293b" : STATE_COLOR[state]);
  });
  const vs: VisualState = walking ? "walking" : state;
  const label = labelTexture([name, STATE_RU[vs] + (runtime && vs !== "idle" ? ` · ${runtime}` : "")], STATE_COLOR[vs]);
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(name); };
  return (
    <group>
      <mesh position={[seat.x + Math.sin(seat.yaw) * -0.87, 1.32, seat.z + Math.cos(seat.yaw) * -0.87]} rotation-y={seat.yaw}>
        <planeGeometry args={[1.2, 0.38]} /><meshBasicMaterial ref={screen} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <group ref={g} onClick={click} onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}>
        <Body shirt={color} pose={walking ? "walk" : state === "waiting" ? "stand" : "sit"} phase={name.length} typing={state === "working"} />
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}><ringGeometry args={[0.55, selected ? 0.85 : 0.72, 24]} /><meshBasicMaterial ref={ring} toneMapped={false} /></mesh>
        <mesh position={[0, 0.6, 0]} visible={false}><boxGeometry args={[1, 1.8, 1]} /></mesh>
        <sprite position={[0, 2.35, 0]} scale={[0.5, 0.5, 1]}><spriteMaterial map={iconTex(vs)} depthTest={false} /></sprite>
        {(hover || selected) && <sprite position={[0, 3.05, 0]} scale={[0.75 * (label.userData.aspect ?? 3), 0.75, 1]}><spriteMaterial map={label} depthTest={false} /></sprite>}
      </group>
    </group>
  );
}

/** Decorative staff (no badge, grey uniform): not agents and never shown as doing real work. */
export function Staff({ seat, i }: { seat: Seat; i: number }) {
  const g = useRef<THREE.Group>(null!);
  useFrame(() => { g.current.rotation.y = seat.yaw + Math.sin(sim.t * 0.4 + i) * 0.6; });
  return <group ref={g} position={[seat.x, 0.34, seat.z]}><Body shirt="#7b8794" pose="stand" phase={i} typing={false} /></group>;
}

/** Animated equipment (visual only). */
export function Prop({ a }: { a: Anim }) {
  const ref = useRef<THREE.Group>(null!), sub = useRef<THREE.Group>(null!);
  const leds = useRef<THREE.InstancedMesh>(null!);
  const n = a.kind === "leds" ? Math.floor((a.d ?? 6) / 0.5) * 4 : 0;
  useEffect(() => {
    if (a.kind !== "leds") return;
    const m = new THREE.Matrix4();
    for (let i = 0; i < n; i++) { m.makeTranslation(0, 0.5 + (i % 4) * 0.45, -(a.d ?? 6) / 2 + Math.floor(i / 4) * 0.5); leds.current.setMatrixAt(i, m); }
    leds.current.instanceMatrix.needsUpdate = true;
  }, [a, n]);
  const col = useMemo(() => new THREE.Color(), []);
  useFrame(() => {
    const t = sim.t;
    if (a.kind === "arm") { ref.current.rotation.y = Math.sin(t * 0.9 + a.x) * 1.2; sub.current.rotation.z = -0.6 + Math.sin(t * 1.7 + a.x) * 0.4; }
    if (a.kind === "conveyor") ref.current.children.forEach((c, i) => { c.position.x = (((t * 1.2 + i * 4) % (a.w ?? 20)) - (a.w ?? 20) / 2); });
    if (a.kind === "forklift") { const f = (t * 0.08) % 2, u = f < 1 ? f : 2 - f; ref.current.position.x = a.x - (a.w ?? 10) / 2 + u * (a.w ?? 10); ref.current.rotation.y = f < 1 ? Math.PI / 2 : -Math.PI / 2; }
    if (a.kind === "brain" || a.kind === "globe") { ref.current.rotation.y = t * 0.6; ref.current.scale.setScalar(1 + Math.sin(t * 2) * 0.04); }
    if (a.kind === "robot") ref.current.rotation.y = Math.sin(t * 0.5) * 1.5;
    if (a.kind === "leds" && leds.current) {
      for (let i = 0; i < n; i++) leds.current.setColorAt(i, col.set(Math.sin(t * (3 + (i % 7)) + i * 1.3) > 0.2 ? (i % 5 ? "#34d399" : "#60a5fa") : "#0f172a"));
      leds.current.instanceColor!.needsUpdate = true;
    }
  });
  const Y = 0.34;
  switch (a.kind) {
    case "arm": return (
      <group position={[a.x, Y, a.z]}>
        <mesh material={mats().darkMetal}><cylinderGeometry args={[0.45, 0.55, 0.4, 12]} /></mesh>
        <group ref={ref} position={[0, 0.4, 0]}>
          <mesh position={[0, 0.7, 0]} material={mats()[a.color ?? "yellow"]}><boxGeometry args={[0.35, 1.4, 0.35]} /></mesh>
          <group ref={sub} position={[0, 1.4, 0]}><mesh position={[0.6, 0, 0]} material={mats()[a.color ?? "yellow"]}><boxGeometry args={[1.2, 0.28, 0.28]} /></mesh>
            <mesh position={[1.25, -0.15, 0]} material={mats().blueLight}><sphereGeometry args={[0.12, 8, 6]} /></mesh></group>
        </group>
      </group>);
    case "conveyor": return (
      <group ref={ref} position={[a.x, Y + 1.05, a.z]}>
        {Array.from({ length: Math.max(2, Math.floor((a.w ?? 20) / 4)) }, (_, i) => <mesh key={i} material={i % 2 ? mats().metal : mats().white}><boxGeometry args={[1.4, 0.35, 0.9]} /></mesh>)}
      </group>);
    case "forklift": return (
      <group ref={ref} position={[a.x, Y, a.z]}>
        <mesh position={[0, 0.6, 0]} material={mats().yellow}><boxGeometry args={[1.2, 0.9, 2]} /></mesh>
        <mesh position={[0, 1.4, -0.3]} material={mats().darkMetal}><boxGeometry args={[1.1, 0.7, 0.9]} /></mesh>
        <mesh position={[0, 1.2, 1.2]} material={mats().darkMetal}><boxGeometry args={[0.9, 2.2, 0.1]} /></mesh>
        <mesh position={[0, 0.7, 1.6]} material={mats().wood}><boxGeometry args={[1, 0.6, 0.8]} /></mesh>
      </group>);
    case "leds": return <instancedMesh ref={leds} args={[undefined, undefined, n]} position={[a.x, Y, a.z]}><boxGeometry args={[0.04, 0.06, 0.12]} /><meshBasicMaterial toneMapped={false} /></instancedMesh>;
    case "brain": return <group ref={ref} position={[a.x, Y + 2.3, a.z]}><mesh><icosahedronGeometry args={[1.3, 2]} /><meshBasicMaterial color="#59c9ff" wireframe toneMapped={false} /></mesh>
      <mesh><icosahedronGeometry args={[0.9, 1]} /><meshBasicMaterial color="#2aa8ff" transparent opacity={0.5} toneMapped={false} /></mesh></group>;
    case "globe": return <group ref={ref} position={[a.x, Y + 1.8, a.z]}><mesh><sphereGeometry args={[1, 18, 12]} /><meshBasicMaterial color="#7fd6ff" wireframe toneMapped={false} /></mesh>
      <mesh rotation-x={Math.PI / 2}><torusGeometry args={[1.25, 0.03, 6, 40]} /><meshBasicMaterial color="#7fd6ff" toneMapped={false} /></mesh></group>;
    case "robot": return <group ref={ref} position={[a.x, Y + 0.3, a.z]}><Body shirt="#e5e7eb" pose="stand" phase={1} typing={false} />
      <mesh position={[0, 1.1, 0.14]} material={mats().blueLight}><boxGeometry args={[0.2, 0.2, 0.05]} /></mesh></group>;
  }
}
