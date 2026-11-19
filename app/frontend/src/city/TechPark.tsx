import { useMemo, useRef, useState } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { District } from "../types";
import { labelTexture, sim } from "./env";
import { TECH_CELLS } from "./Residential";

const HUES = ["#38bdf8", "#60a5fa", "#a78bfa", "#f59e0b", "#f43f5e", "#34d399", "#22d3ee", "#94a3b8", "#fbbf24", "#e879f9", "#4ade80"];
const SHORT: Record<string, string> = {
  "00-jarvis": "JARVIS", "01-core-development": "Разработка", "02-language-specialists": "Языки", "03-infrastructure": "Инфраструктура",
  "04-quality-security": "Качество и безопасность", "05-data-ai": "Данные и ИИ", "06-developer-experience": "Инструменты",
  "07-specialized-domains": "Отрасли", "08-business-product": "Бизнес и продукт", "09-meta-orchestration": "Диспетчерская",
  "10-research-analysis": "Исследования",
};
export const shortName = (folder: string) => SHORT[folder] ?? folder;

interface Props { districts: District[]; selected: string | null; onSelect: (folder: string) => void; paused: boolean; running: number }

/** Technology park: one building per agent district, around the central JARVIS tower. */
export function TechPark({ districts, selected, onSelect, paused, running }: Props) {
  const tower = districts.find((d) => d.folder === "00-jarvis");
  const others = districts.filter((d) => d.folder !== "00-jarvis");
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[45, 0.08, 25]} receiveShadow>
        <circleGeometry args={[19, 48]} /><meshStandardMaterial color="#d6d3cb" />
      </mesh>
      {others.map((d, i) => {
        const [x, z] = TECH_CELLS[i + 1] ?? [0, 0];
        return <DistrictBuilding key={d.folder} d={d} x={x} z={z} color={HUES[(i + 1) % HUES.length]}
          selected={selected === d.folder} onSelect={onSelect} />;
      })}
      {tower && <JarvisTower d={tower} selected={selected === tower.folder} onSelect={onSelect} paused={paused} running={running} />}
    </group>
  );
}

function useHover() {
  const [hover, setHover] = useState(false);
  return {
    hover,
    bind: {
      onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; },
      onPointerOut: () => { setHover(false); document.body.style.cursor = ""; },
    },
  };
}

function DistrictBuilding({ d, x, z, color, selected, onSelect }:
  { d: District; x: number; z: number; color: string; selected: boolean; onSelect: (f: string) => void }) {
  const { hover, bind } = useHover();
  const glass = useRef<THREE.MeshStandardMaterial>(null!);
  const ring = useRef<THREE.Mesh>(null!);
  const h = 16 + Math.min(70, d.count * 2.1);
  const empty = d.count === 0;
  const label = labelTexture([shortName(d.folder), empty ? "свободный участок" : `${d.count} агентов${d.working ? ` · работают ${d.working}` : ""}`],
    d.working ? "#fde68a" : "#e2f3ff");
  const base = useMemo(() => new THREE.Color(color), [color]);
  const hot = useMemo(() => new THREE.Color("#fbbf24"), []);
  useFrame(() => {
    const pulse = d.working ? 0.6 + Math.sin(sim.t * 5) * 0.4 : 0;
    glass.current.emissive.copy(d.working ? hot : base);
    glass.current.emissiveIntensity = (d.working ? 0.9 * pulse : 0.12 + sim.sun.night * 0.55) + (hover || selected ? 0.35 : 0);
    if (ring.current) ring.current.rotation.z += 0.01;
  });
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(d.folder); };
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.5, 0]} receiveShadow><boxGeometry args={[34, 1, 34]} /><meshStandardMaterial color="#cfd5db" /></mesh>
      {empty ? (
        <mesh position={[0, 2, 0]} onClick={click} {...bind}>
          <boxGeometry args={[22, 3, 22]} /><meshStandardMaterial ref={glass} color="#94a3b8" wireframe />
        </mesh>
      ) : (
        <group onClick={click} {...bind}>
          <mesh position={[0, h / 2 + 1, 0]} castShadow>
            <boxGeometry args={[18, h, 18]} />
            <meshStandardMaterial ref={glass} color={color} metalness={0.6} roughness={0.15} transparent opacity={0.92} />
          </mesh>
          <mesh position={[0, h * 0.35 + 1, 0]} castShadow>
            <boxGeometry args={[22, h * 0.7, 10]} /><meshStandardMaterial color="#e5e7eb" metalness={0.2} roughness={0.5} />
          </mesh>
          <mesh position={[0, h + 1.6, 0]}><boxGeometry args={[19, 1.2, 19]} /><meshStandardMaterial color="#1f2937" /></mesh>
        </group>
      )}
      {(selected || hover) && (
        <mesh ref={ring} rotation-x={-Math.PI / 2} position={[0, 1.2, 0]}>
          <ringGeometry args={[19, 20.5, 48]} /><meshBasicMaterial color={selected ? "#fbbf24" : "#7dd3fc"} />
        </mesh>
      )}
      <sprite position={[0, (empty ? 6 : h) + 9, 0]} scale={[11 * (label.userData.aspect ?? 3), 11, 1]} onClick={click}>
        <spriteMaterial map={label} depthTest={false} transparent />
      </sprite>
    </group>
  );
}

/** Central JARVIS tower (Рова Алеф) — the coordinator and the control panel of the city. */
function JarvisTower({ d, selected, onSelect, paused, running }:
  { d: District; selected: boolean; onSelect: (f: string) => void; paused: boolean; running: number }) {
  const { hover, bind } = useHover();
  const rings = useRef<THREE.Group>(null!);
  const beacon = useRef<THREE.MeshStandardMaterial>(null!);
  const core = useRef<THREE.MeshStandardMaterial>(null!);
  const label = labelTexture(["JARVIS", paused ? "очередь остановлена" : running ? `выполняется задач: ${running}` : "центр управления"],
    paused ? "#fca5a5" : "#7dd3fc");
  const cyan = useMemo(() => new THREE.Color("#22d3ee"), []), red = useMemo(() => new THREE.Color("#ef4444"), []);
  useFrame(() => {
    rings.current.rotation.y += running ? 0.03 : 0.006;
    rings.current.children.forEach((c, i) => (c.position.y = 30 + i * 22 + Math.sin(sim.t * 1.5 + i) * 1.5));
    const col = paused ? red : cyan;
    beacon.current.emissive.copy(col);
    beacon.current.emissiveIntensity = 1.5 + Math.sin(sim.t * (running ? 8 : 2)) * 1;
    core.current.emissive.copy(col);
    core.current.emissiveIntensity = 0.25 + sim.sun.night * 0.6 + (running ? 0.4 : 0) + (hover || selected ? 0.3 : 0);
  });
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onSelect(d.folder); };
  return (
    <group position={[45, 0, 25]}>
      <group onClick={click} {...bind}>
        <mesh position={[0, 3, 0]} castShadow receiveShadow><cylinderGeometry args={[14, 16, 6, 8]} /><meshStandardMaterial color="#e5e7eb" /></mesh>
        <mesh position={[0, 48, 0]} castShadow>
          <cylinderGeometry args={[4.5, 9, 90, 8]} />
          <meshStandardMaterial ref={core} color="#0f172a" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 98, 0]} castShadow><cylinderGeometry args={[7, 4.5, 10, 8]} /><meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.3} /></mesh>
        <mesh position={[0, 112, 0]}><cylinderGeometry args={[0.4, 1, 20, 6]} /><meshStandardMaterial color="#cbd5e1" /></mesh>
        <mesh position={[0, 123, 0]}><sphereGeometry args={[1.6, 16, 12]} /><meshStandardMaterial ref={beacon} color="#ffffff" /></mesh>
      </group>
      <group ref={rings}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation-x={Math.PI / 2}>
            <torusGeometry args={[11 - i * 1.5, 0.35, 8, 48]} /><meshBasicMaterial color={paused ? "#f87171" : "#67e8f9"} transparent opacity={0.85} />
          </mesh>
        ))}
      </group>
      {(selected || hover) && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 6.2, 0]}><ringGeometry args={[16, 17.5, 48]} /><meshBasicMaterial color="#fbbf24" /></mesh>
      )}
      <sprite position={[0, 136, 0]} scale={[13 * (label.userData.aspect ?? 3), 13, 1]} onClick={click}>
        <spriteMaterial map={label} depthTest={false} transparent />
      </sprite>
    </group>
  );
}
