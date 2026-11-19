import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cells, cellUse, COAST_X } from "./plan";
import { box, cyl, labelTexture, mats, mergeParts, rng, torus, translateParts, type Part } from "./kit";
import { building, industrialDecor, tree } from "./builders";
import { Smoke } from "./Life";
import { sim } from "./sim";

/** Decorative city blocks (one merged mesh per material per block → frustum culling per block, few draw calls). */
export function Blocks({ low }: { low: boolean }) {
  const { blocks, smoke } = useMemo(() => {
    const out: { key: string; merged: ReturnType<typeof mergeParts> }[] = [];
    const smoke: [number, number, number][] = [];
    for (const c of cells()) {
      const use = cellUse(c.cx, c.cz), r = rng(Math.abs(Math.round(c.cx * 31 + c.cz * 17)) + 5), w = c.x1 - c.x0, d = c.z1 - c.z0;
      const parts: Part[] = [];
      if (use === "residential") {
        parts.push(box(w, 0.1, d, c.cx, 0.02, c.cz, "paver"));
        const coastal = c.cx < -40, nx = w > 30 ? 2 : 1, nz = d > 30 ? 2 : 1;
        for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) {
          const lw = w / nx, ld = d / nz, bw = Math.min(lw - 5, 12 + r() * 6), bd = Math.min(ld - 5, 11 + r() * 6);
          const floors = coastal ? 7 + Math.floor(r() * 7) : 3 + Math.floor(r() * 5);
          const x = c.x0 + lw * (a + 0.5), z = c.z0 + ld * (b + 0.5);
          parts.push(...translateParts(building(r() < 0.45 ? "brick-residential" : "residential", bw, bd, floors, Math.floor(r() * 1e6)), x, 0, z));
          for (let k = 0; k < 3; k++) parts.push(...tree(x + (r() - 0.5) * lw * 0.9, z + ld / 2 - 1.8, r));
        }
      } else if (use === "industrial") {
        parts.push(box(w, 0.1, d, c.cx, 0.02, c.cz, "roof"));
        const dec = industrialDecor(w, d, Math.floor(r() * 1e6));
        parts.push(...translateParts(dec.parts, c.cx, 0, c.cz));
        dec.smoke.forEach(([x, y, z]) => smoke.push([x + c.cx, y, z + c.cz]));
        parts.push(...translateParts(building("workshop", Math.min(22, w * 0.4), Math.min(16, d * 0.35), 2, Math.floor(r() * 1e6)), c.cx - w * 0.25, 0, c.cz + d * 0.28));
      } else if (use === "logistics") {
        parts.push(box(w, 0.1, d, c.cx, 0.02, c.cz, "asphalt"));
        parts.push(...translateParts(building("warehouse", w * 0.8, d * 0.4, 2, 7), c.cx, 0, c.cz - d * 0.22));
        for (let i = 0; i < 5; i++) parts.push(...truck(c.x0 + 6 + i * (w - 12) / 4, c.cz + d * 0.16, r));
        for (let i = 0; i < 24; i++) parts.push(box(6, 2.6, 2.4, c.x0 + 6 + (i % 6) * 7, 2.6 * Math.floor(r() * 2), c.cz + d * 0.34 + Math.floor(i / 6) * 2.6,
          (["red", "yellow", "corrugated", "darkMetal"] as const)[Math.floor(r() * 4)]));
      } else if (use === "parks") {
        parts.push(box(w, 0.12, d, c.cx, 0.02, c.cz, "grass"));
        parts.push(cyl(w * 0.22, w * 0.22, 0.1, c.cx - w * 0.12, 0.08, c.cz + d * 0.1, "water", 32));
        parts.push(torus(w * 0.22, 0.4, c.cx - w * 0.12, 0.25, c.cz + d * 0.1, "paver"));
        parts.push(box(2.4, 0.5, w * 0.3, c.cx - w * 0.12, 0.6, c.cz + d * 0.1, "wood"));                  // footbridge
        const gx = c.cx + w * 0.25, gz = c.cz - d * 0.2;                                                     // gazebo
        parts.push(cyl(4, 4, 0.4, gx, 0, gz, "paver", 8), cyl(4.6, 0.2, 2, gx, 3.4, gz, "red", 8));
        for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; parts.push(cyl(0.15, 0.15, 3.4, gx + Math.cos(a) * 3.6, 0, gz + Math.sin(a) * 3.6, "white", 6)); }
        for (let i = 0; i < 26; i++) parts.push(...tree(c.x0 + 3 + r() * (w - 6), c.z0 + 3 + r() * (d - 6), r));
        for (let i = 0; i < 14; i++) { const g = new THREE.IcosahedronGeometry(0.9, 0); g.translate(c.x0 + 4 + r() * (w - 8), 0.7, c.z0 + 4 + r() * (d - 8)); parts.push({ g, m: "red" }); }
        for (let i = 0; i < 6; i++) parts.push(box(2.4, 0.5, 0.7, c.x0 + 8 + i * (w - 16) / 5, 0.4, c.z1 - 4, "wood"));
      } else if (use === "coast") {
        parts.push(box(w, 0.1, d, c.cx, 0.02, c.cz, "paver"));
        for (let z = c.z0 + 4; z < c.z1; z += 10) parts.push(...tree(c.x0 + 4, z, r));
        parts.push(box(4, 3, 4, c.cx, 0, c.cz, "white"), box(5, 0.3, 5, c.cx, 3, c.cz, "red"));            // beach kiosk
      } else continue;
      out.push({ key: `${c.i},${c.j}`, merged: mergeParts(parts) });
    }
    return { blocks: out, smoke };
  }, []);
  return (
    <group>
      {blocks.map((b) => b.merged.map(({ m, g }) => (
        <mesh key={`${b.key}-${m}`} geometry={g} material={mats()[m]} castShadow={!low && m !== "paver" && m !== "grass" && m !== "roof"} receiveShadow />
      )))}
      <Smoke sources={low ? smoke.slice(0, 6) : smoke} />
    </group>
  );
}

function truck(x: number, z: number, r: () => number): Part[] {
  const col = r() > 0.5 ? "white" : "red";
  return [box(2.5, 3.2, 8, x, 0.3, z, col), box(2.5, 2.2, 2.2, x, 0.3, z + 5.2, "darkMetal")];
}

/** Port of Ashdod: quays, container terminal, ship-to-shore cranes with moving trolleys, cargo ships. */
export function Port() {
  const yard = useMemo(() => {
    const p: Part[] = [box(140, 1.6, 120, COAST_X - 20, -0.8, -150, "concrete"), box(70, 1.6, 26, COAST_X - 110, -0.8, -110, "concrete"),
                       box(10, 3, 220, COAST_X - 160, -1.2, -150, "roof")];                                    // breakwater
    const r = rng(31), cols = ["red", "yellow", "corrugated", "darkMetal", "white"] as const;
    for (let x = COAST_X - 80; x < COAST_X + 40; x += 7) for (let z = -200; z < -110; z += 3.1) {
      if (r() < 0.2) continue; const h = 1 + Math.floor(r() * 4);
      for (let k = 0; k < h; k++) p.push(box(6, 2.55, 2.5, x, 0.8 + k * 2.6, z, cols[Math.floor(r() * cols.length)]));
    }
    return mergeParts(p);
  }, []);
  const label = labelTexture(["Порт Ашдода", "контейнерный терминал"], "#fcd34d");
  return (
    <group>
      {yard.map(({ m, g }) => <mesh key={m} geometry={g} material={mats()[m]} castShadow receiveShadow />)}
      {[-195, -170, -145, -120].map((z, i) => <Crane key={i} x={COAST_X - 88} z={z} phase={i} />)}
      <Ship r={300} speed={0.006} phase={0} /><Ship r={380} speed={0.004} phase={0.4} /><Ship r={460} speed={0.003} phase={0.75} />
      <sprite position={[COAST_X - 30, 42, -150]} scale={[16 * (label.userData.aspect ?? 3), 16, 1]}><spriteMaterial map={label} depthTest={false} /></sprite>
    </group>
  );
}

function Crane({ x, z, phase }: { x: number; z: number; phase: number }) {
  const trolley = useRef<THREE.Group>(null!);
  const frame = useMemo(() => {
    const p: Part[] = [];
    for (const dz of [-6, 6]) for (const dx of [-7, 7]) p.push(box(1.2, 34, 1.2, dx, 0, dz, "red"));
    p.push(box(70, 2.4, 2.4, -14, 34, -6, "red"), box(70, 2.4, 2.4, -14, 34, 6, "red"), box(16, 6, 14, 0, 34, 0, "white"));
    for (let k = -4; k <= 4; k++) p.push(box(1, 1, 13, k * 7 - 14, 35.5, 0, "red"));
    return mergeParts(p);
  }, []);
  useFrame(() => { trolley.current.position.x = -30 + Math.sin(sim.t * 0.2 + phase) * 18; });
  return (
    <group position={[x, 0.8, z]}>
      {frame.map(({ m, g }) => <mesh key={m} geometry={g} material={mats()[m]} castShadow />)}
      <group ref={trolley}><mesh position={[0, 32, 0]} material={mats().darkMetal}><boxGeometry args={[4, 2, 12]} /></mesh>
        <mesh position={[0, 24, 0]} material={mats().yellow}><boxGeometry args={[6, 2.5, 2.5]} /></mesh></group>
      <mesh position={[0, 41, 0]} material={mats().warmLight}><sphereGeometry args={[0.6, 8, 6]} /></mesh>
    </group>
  );
}

function Ship({ r, speed, phase }: { r: number; speed: number; phase: number }) {
  const g = useRef<THREE.Group>(null!);
  const parts = useMemo(() => {
    const rr = rng(Math.floor(phase * 100) + 1), p: Part[] = [box(14, 6, 80, 0, -2, 0, (["red", "darkMetal", "corrugated"] as const)[Math.floor(phase * 3) % 3]),
      box(12, 9, 10, 0, 4, -30, "white"), box(4, 3, 4, 0, 13, -32, "darkMetal")];
    for (let z = -22; z < 36; z += 6.5) for (let k = 0; k < 2 + Math.floor(rr() * 2); k++)
      p.push(box(12, 2.5, 6, 0, 4 + k * 2.6, z, (["red", "yellow", "corrugated", "white"] as const)[Math.floor(rr() * 4)]));
    return mergeParts(p);
  }, [phase]);
  useFrame(() => {
    const a = (phase + sim.t * speed) * Math.PI * 2, b = a + 0.01;
    const x = COAST_X - 240 - Math.cos(a) * r * 0.5, z = -60 + Math.sin(a) * r, nx = COAST_X - 240 - Math.cos(b) * r * 0.5, nz = -60 + Math.sin(b) * r;
    g.current.position.set(x, Math.sin(sim.t + phase * 9) * 0.25, z); g.current.rotation.y = Math.atan2(nx - x, nz - z);
  });
  return <group ref={g}>{parts.map(({ m, g: geo }) => <mesh key={m} geometry={geo} material={mats()[m]} castShadow />)}</group>;
}

/** Marina and promenade: breakwaters, piers, bobbing yachts, sailing boats. */
export function Marina() {
  const hulls = useRef<THREE.InstancedMesh>(null!), masts = useRef<THREE.InstancedMesh>(null!);
  const boats = useMemo(() => {
    const r = rng(12), out: [number, number, number][] = [];
    for (let row = 0; row < 4; row++) for (let z = 75; z < 215; z += 5.5) out.push([COAST_X - 12 - row * 14 + (r() - 0.5), z + r(), r() * 6]);
    return out;
  }, []);
  const dock = useMemo(() => {
    const p: Part[] = [box(6, 3, 160, COAST_X - 70, -1.4, 145, "roof"), box(70, 3, 6, COAST_X - 35, -1.4, 66, "roof"), box(50, 3, 6, COAST_X - 25, -1.4, 224, "roof")];
    for (let row = 0; row < 4; row++) p.push(box(1.6, 0.4, 140, COAST_X - 18 - row * 14, 0.1, 145, "wood"));
    p.push(box(12, 0.4, 170, COAST_X + 6, 0.05, 145, "paver"));
    return mergeParts(p);
  }, []);
  const m = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []), e = useMemo(() => new THREE.Euler(), []);
  const v = useMemo(() => new THREE.Vector3(), []), s = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    boats.forEach(([x, z, ph], i) => {
      q.setFromEuler(e.set(Math.sin(sim.t * 1.1 + ph) * 0.05, Math.PI / 2, Math.cos(sim.t * 0.9 + ph) * 0.04));
      m.compose(v.set(x, Math.sin(sim.t * 1.5 + ph) * 0.15, z), q, s.set(1.9, 1.1, 5)); hulls.current.setMatrixAt(i, m);
      m.compose(v.set(x, 4.5, z), q, s.set(0.12, 8, 0.12)); masts.current.setMatrixAt(i, m);
    });
    hulls.current.instanceMatrix.needsUpdate = masts.current.instanceMatrix.needsUpdate = true;
  });
  const label = labelTexture(["Марина Ашдода", "набережная"], "#7dd3fc");
  return (
    <group>
      {dock.map(({ m: mk, g }) => <mesh key={mk} geometry={g} material={mats()[mk]} receiveShadow castShadow />)}
      <instancedMesh ref={hulls} args={[undefined, mats().white, boats.length]} castShadow><boxGeometry /></instancedMesh>
      <instancedMesh ref={masts} args={[undefined, mats().metal, boats.length]}><boxGeometry /></instancedMesh>
      <sprite position={[COAST_X - 35, 26, 145]} scale={[13 * (label.userData.aspect ?? 3), 13, 1]}><spriteMaterial map={label} depthTest={false} /></sprite>
    </group>
  );
}

export function SiteDressing() {
  // trees and parking around the plaza ring (the plaza itself is part of the tower complex)
  const merged = useMemo(() => {
    const r = rng(77), p: Part[] = [];
    for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; p.push(...tree(Math.cos(a) * 50, Math.sin(a) * 50, r)); }
    return mergeParts(p);
  }, []);
  return <group>{merged.map(({ m, g }) => <mesh key={m} geometry={g} material={mats()[m]} castShadow />)}</group>;
}
