import { useMemo, useRef } from "react";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { box, cyl, labelTexture, logoTexture, mats, mergeParts, pipe, rng, torus, type Part } from "./kit";
import { tree } from "./builders";
import { sim } from "./sim";

export const TOWER_H = 185;

/** Central JARVIS tower: stepped monumental core, buttress fins, glass sections, blue light lines, logo, spire, plaza. */
export function TowerExterior({ onOpen, hover, setHover, paused, running }:
  { onOpen: () => void; hover: boolean; setHover: (v: boolean) => void; paused: boolean; running: number }) {
  const merged = useMemo(() => {
    const p: Part[] = [];
    // plaza, gardens, access roads
    p.push(cyl(48, 48, 0.12, 0, 0, 0, "paver", 64), torus(40, 2.2, 0, 0.15, 0, "grass"), torus(46, 3.5, 0, 0.1, 0, "asphalt"));
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { const g = new THREE.BoxGeometry(9, 0.1, 16); g.translate(0, 0.08, 54); g.rotateY(a); p.push({ g, m: "asphalt" }); }
    const r = rng(17); for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; if (Math.abs(Math.sin(a * 2)) < 0.25) continue; p.push(...tree(Math.cos(a) * 40, Math.sin(a) * 40, r)); }
    // fountain basin in front of the entrance (+z)
    p.push(cyl(8, 8.4, 0.9, 0, 0, 30, "concrete", 40), torus(8.2, 0.35, 0, 0.9, 30, "gold"), cyl(7.6, 7.6, 0.1, 0, 0.8, 30, "water", 40));
    for (const s of [-1, 1]) p.push(cyl(3.5, 3.6, 0.6, s * 22, 0, 22, "concrete", 24), cyl(3.2, 3.2, 0.1, s * 22, 0.5, 22, "water", 24));
    // underground parking entrance
    p.push(box(9, 0.6, 22, -30, -0.4, 20, "darkMetal"), box(0.4, 3, 22, -34.6, 0, 20, "concrete"), box(0.4, 3, 22, -25.4, 0, 20, "concrete"),
           box(9.4, 0.5, 2, -30, 3, 31, "yellow"), box(2.4, 2.4, 0.3, -30, 3.6, 31.2, "blueLight"));
    // podium: wide panoramic ring + glass lobby drum
    p.push(cyl(24, 25, 6, 0, 0, 0, "concrete", 48), cyl(24.4, 24.4, 0.6, 0, 6, 0, "gold", 48), cyl(19, 19, 10, 0, 6.6, 0, "towerGlass", 48),
           cyl(19.5, 19.5, 0.8, 0, 16.6, 0, "gold", 48), torus(24.6, 0.25, 0, 3, 0, "blueLight"));
    p.push(box(14, 0.6, 7, 0, 5.4, 26, "darkMetal"), box(13, 0.1, 6, 0, 5.35, 26, "warmLight"), box(10, 5, 0.4, 0, 0, 24.6, "glassClear"));
    // stepped octagonal core
    const tiers = [[13, 11, 17, 44], [11, 9, 61, 38], [9, 7, 99, 30], [7, 5, 129, 18]] as const;
    for (const [rb, rt, y, h] of tiers) {
      p.push(cyl(rt, rb, h, 0, y, 0, "towerGlass", 8), cyl(rb + 0.6, rb + 0.6, 1.2, 0, y, 0, "darkMetal", 8), torus(rb + 0.2, 0.22, 0, y + 1.3, 0, "blueLight"));
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + Math.PI / 8;                                   // vertical light lines on the edges
        p.push(pipe([Math.cos(a) * rb, y + 1.5, Math.sin(a) * rb], [Math.cos(a) * rt, y + h - 0.5, Math.sin(a) * rt], 0.18, k % 2 ? "blueLight" : "gold")); }
    }
    // panoramic observation deck at the top of tier 3
    p.push(cyl(12, 12, 1, 0, 128, 0, "darkMetal", 32), cyl(11.6, 11.6, 4, 0, 129, 0, "glassClear", 32), torus(12, 0.3, 0, 129, 0, "blueLight"));
    // buttress fins on the diagonals, stepped
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 4, cx = Math.cos(a), cz = Math.sin(a);
      for (const [dist, h, y, wdt] of [[17, 62, 0, 4], [13, 44, 62, 3], [10, 26, 106, 2.2]] as const) {
        const g = new THREE.BoxGeometry(wdt, h, 9 - y / 30); g.rotateY(-a); g.translate(cx * dist, y + h / 2, cz * dist); p.push({ g, m: "darkMetal" });
        const e = new THREE.BoxGeometry(wdt + 0.3, h, 0.35); e.rotateY(-a + Math.PI / 2); e.translate(cx * (dist + 4.6 - y / 60), y + h / 2, cz * (dist + 4.6 - y / 60)); p.push({ g: e, m: "gold" });
        p.push(pipe([cx * (dist + 0.2), y + 2, cz * (dist + 0.2)], [cx * (dist + 0.2), y + h - 1, cz * (dist + 0.2)], 0.2, "blueLight"));
      }
    }
    // crown + spire
    p.push(cyl(4, 6, 8, 0, 147, 0, "gold", 8), cyl(1.4, 3, 12, 0, 155, 0, "darkMetal", 8), cyl(0.25, 1.2, 18, 0, 167, 0, "gold", 8));
    return mergeParts(p);
  }, []);
  const jet = useRef<THREE.Group>(null!), beacon = useRef<THREE.MeshBasicMaterial>(null!), beam = useRef<THREE.MeshBasicMaterial>(null!);
  useFrame(() => {
    jet.current.children.forEach((c, i) => { const f = (sim.t * 0.8 + i / 8) % 1; c.position.y = 1 + Math.sin(f * Math.PI) * 9; c.scale.setScalar(1 - f * 0.6); });
    beacon.current.color.set(paused ? "#ff4d4d" : "#7fe3ff").multiplyScalar(1.2 + Math.sin(sim.t * (running ? 8 : 2)) * 0.6);
    beam.current.opacity = 0.08 + sim.sun.night * 0.25 + (running ? 0.1 : 0);
    beam.current.color.set(paused ? "#ff6b6b" : "#59c9ff");
  });
  const label = labelTexture(["JARVIS", paused ? "очередь остановлена" : running ? `выполняется задач: ${running}` : "центр управления"], paused ? "#fca5a5" : "#7dd3fc");
  const logo = logoTexture();
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onOpen(); };
  return (
    <group>
      <group onClick={click} onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}>
        {merged.map(({ m, g }) => <mesh key={m} geometry={g} material={mats()[m]} castShadow={m !== "paver" && m !== "asphalt"} receiveShadow />)}
        <mesh position={[0, 42, 12.4]}><planeGeometry args={[13, 16.25]} /><meshBasicMaterial map={logo} transparent toneMapped={false} /></mesh>
        <mesh position={[0, 42, -12.4]} rotation-y={Math.PI}><planeGeometry args={[13, 16.25]} /><meshBasicMaterial map={logo} transparent toneMapped={false} /></mesh>
        <mesh position={[0, 177, 0]}><sphereGeometry args={[1.6, 16, 12]} /><meshBasicMaterial ref={beacon} toneMapped={false} /></mesh>
      </group>
      <mesh position={[0, 177 + 150, 0]}><cylinderGeometry args={[0.6, 2.5, 300, 12, 1, true]} /><meshBasicMaterial ref={beam} transparent depthWrite={false} side={THREE.DoubleSide} toneMapped={false} /></mesh>
      <group ref={jet} position={[0, 0, 30]}>
        {Array.from({ length: 8 }, (_, i) => <mesh key={i}><sphereGeometry args={[0.9, 10, 8]} /><meshStandardMaterial color="#bfe9ff" transparent opacity={0.6} emissive="#3fb7ff" emissiveIntensity={0.6} /></mesh>)}
      </group>
      {hover && <mesh rotation-x={-Math.PI / 2} position={[0, 0.3, 0]}><ringGeometry args={[26, 28, 64]} /><meshBasicMaterial color="#fbbf24" /></mesh>}
      <sprite position={[0, 196, 0]} scale={[14 * (label.userData.aspect ?? 3), 14, 1]} onClick={click}><spriteMaterial map={label} depthTest={false} /></sprite>
    </group>
  );
}
