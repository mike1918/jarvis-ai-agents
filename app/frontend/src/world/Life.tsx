import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { AVENUES, COAST_X, RAIL_Z, ROAD_W, STREETS, WORLD } from "./plan";
import { mats, mergeParts, box, rng, type Part } from "./kit";
import { buildLanes, buildPedGraph, green, pedPos, spawnPeds, spawnVehicles, stepPeds, stepVehicles, vehiclePos } from "./traffic";
import { sim } from "./sim";

const Z0 = WORLD.minZ + 26, Z1 = WORLD.maxZ, X0 = COAST_X + 14, X1 = WORLD.maxX;

/** Road surfaces, lane markings, crosswalks, stop lines and traffic signals (signals follow the real simulation phase). */
export function Roads() {
  const merged = useMemo(() => {
    const p: Part[] = [];
    for (const x of AVENUES) p.push(box(ROAD_W, 0.06, Z1 - Z0, x, 0.02, (Z0 + Z1) / 2, "asphalt"));
    for (const z of STREETS) p.push(box(X1 - X0, 0.06, ROAD_W, (X0 + X1) / 2, 0.025, z, "asphalt"));
    p.push(box(9, 0.06, Z1 - Z0, COAST_X + 18, 0.02, (Z0 + Z1) / 2, "asphalt"));                         // coastal boulevard
    for (const x of AVENUES) for (let z = Z0; z < Z1; z += 8) if (!STREETS.some((Z) => Math.abs(z - Z) < 9)) p.push(box(0.25, 0.02, 4, x, 0.09, z, "white"));
    for (const z of STREETS) for (let x = X0; x < X1; x += 8) if (!AVENUES.some((X) => Math.abs(x - X) < 9)) p.push(box(4, 0.02, 0.25, x, 0.09, z, "white"));
    for (const X of AVENUES) for (const Z of STREETS) {
      for (const sz of [-1, 1]) for (let k = -3; k <= 3; k++) p.push(box(0.7, 0.02, 2.6, X + k * 1.2, 0.09, Z + sz * 6, "white"));   // crosswalk over the avenue
      for (const sx of [-1, 1]) for (let k = -3; k <= 3; k++) p.push(box(2.6, 0.02, 0.7, X + sx * 6, 0.09, Z + k * 1.2, "white"));   // crosswalk over the street
      p.push(box(ROAD_W / 2, 0.02, 0.4, X - 2.2, 0.09, Z - 8, "white"), box(ROAD_W / 2, 0.02, 0.4, X + 2.2, 0.09, Z + 8, "white"));   // stop lines
      p.push(box(0.4, 0.02, ROAD_W / 2, X - 8, 0.09, Z + 2.2, "white"), box(0.4, 0.02, ROAD_W / 2, X + 8, 0.09, Z - 2.2, "white"));
      p.push(box(0.25, 5.5, 0.25, X + 6.3, 0, Z - 6.3, "darkMetal"), box(0.25, 5.5, 0.25, X - 6.3, 0, Z + 6.3, "darkMetal"));
    }
    return mergeParts(p);
  }, []);
  const heads = useMemo(() => {
    const zs: [number, number][] = [], xs: [number, number][] = [];
    for (const X of AVENUES) for (const Z of STREETS) { zs.push([X + 6.3, Z - 6.3]); xs.push([X - 6.3, Z + 6.3]); }
    return { zs, xs };
  }, []);
  const red = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ff3b30", toneMapped: false }), []);
  const grn = useMemo(() => new THREE.MeshBasicMaterial({ color: "#34d399", toneMapped: false }), []);
  const zHead = useRef<THREE.InstancedMesh>(null!), xHead = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4();
    heads.zs.forEach(([x, z], i) => { m.makeTranslation(x, 5.6, z); zHead.current.setMatrixAt(i, m); });
    heads.xs.forEach(([x, z], i) => { m.makeTranslation(x, 5.6, z); xHead.current.setMatrixAt(i, m); });
    zHead.current.instanceMatrix.needsUpdate = xHead.current.instanceMatrix.needsUpdate = true;
  }, [heads]);
  useFrame(() => { zHead.current.material = green("z", sim.t) ? grn : red; xHead.current.material = green("x", sim.t) ? grn : red; });
  return (
    <group>
      {merged.map(({ m, g }) => <mesh key={m} geometry={g} material={mats()[m]} receiveShadow />)}
      <instancedMesh ref={zHead} args={[undefined, red, heads.zs.length]}><boxGeometry args={[0.7, 0.7, 0.7]} /></instancedMesh>
      <instancedMesh ref={xHead} args={[undefined, red, heads.xs.length]}><boxGeometry args={[0.7, 0.7, 0.7]} /></instancedMesh>
    </group>
  );
}

const CAR_COLORS = ["#e5e7eb", "#111827", "#9ca3af", "#b91c1c", "#1d4ed8", "#f5f5f4", "#374151", "#0f766e", "#a16207"];

/** Vehicles on the lane network (car-following + signals; see traffic.ts, unit-tested). */
export function Vehicles({ perLane }: { perLane: number }) {
  const lanes = useMemo(buildLanes, []);
  const vs = useMemo(() => spawnVehicles(lanes, perLane, rng(77)), [lanes, perLane]);
  const body = useRef<THREE.InstancedMesh>(null!), cab = useRef<THREE.InstancedMesh>(null!);
  const hl = useRef<THREE.InstancedMesh>(null!), tl = useRef<THREE.InstancedMesh>(null!);
  const hlMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#fff4cf", transparent: true, toneMapped: false }), []);
  const tlMat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#ff2d2d", transparent: true, toneMapped: false }), []);
  useLayoutEffect(() => {
    const c = new THREE.Color(), r = rng(5);
    vs.forEach((v, i) => {
      body.current.setColorAt(i, c.set(v.kind === "bus" ? "#1f9d63" : v.kind === "truck" ? (r() > 0.5 ? "#f1f1ee" : "#c2410c") : CAR_COLORS[Math.floor(r() * CAR_COLORS.length)]));
      cab.current.setColorAt(i, c.set(v.kind === "truck" ? "#e5e7eb" : "#1e293b"));
    });
    body.current.instanceColor!.needsUpdate = cab.current.instanceColor!.needsUpdate = true;
  }, [vs]);
  const m = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []), up = new THREE.Vector3(0, 1, 0);
  const p = useMemo(() => new THREE.Vector3(), []), s = useMemo(() => new THREE.Vector3(), []), o = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, dt) => {
    stepVehicles(lanes, vs, sim.t, Math.min(dt, 0.1) * (sim.paused ? 0 : 1));
    hlMat.opacity = 0.3 + sim.sun.night * 0.7; tlMat.opacity = 0.25 + sim.sun.night * 0.75;
    vs.forEach((v, i) => {
      const [x, z, yaw] = vehiclePos(lanes[v.lane], v.s); q.setFromAxisAngle(up, yaw);
      const H = v.kind === "bus" ? 3 : v.kind === "truck" ? 3.2 : 1.1, W = v.kind === "car" ? 1.8 : 2.4;
      const hidden = v.s - v.len / 2 > lanes[v.lane].end;            // waiting off-map to re-enter
      m.compose(p.set(x, hidden ? -50 : H / 2 + 0.25, z), q, s.set(W, H, v.len)); body.current.setMatrixAt(i, m);
      const cabLen = v.kind === "truck" ? 2.2 : v.kind === "bus" ? v.len * 0.92 : v.len * 0.5;
      const cabOff = v.kind === "truck" ? v.len / 2 - 1.1 : 0;
      o.set(Math.sin(yaw) * cabOff, 0, Math.cos(yaw) * cabOff);
      m.compose(p.set(x + o.x, hidden ? -50 : (v.kind === "car" ? 1.55 : H * 0.7) + 0.25, z + o.z), q,
        s.set(W * 0.92, v.kind === "car" ? 0.7 : v.kind === "bus" ? 0.8 : 1.2, cabLen)); cab.current.setMatrixAt(i, m);
      const fx = Math.sin(yaw) * (v.len / 2 + 0.03), fz = Math.cos(yaw) * (v.len / 2 + 0.03);
      m.compose(p.set(x + fx, hidden ? -50 : 0.8, z + fz), q, s.set(W * 0.85, 0.25, 0.06)); hl.current.setMatrixAt(i, m);
      m.compose(p.set(x - fx, hidden ? -50 : 0.85, z - fz), q, s.set(W * 0.85, 0.22, 0.06)); tl.current.setMatrixAt(i, m);
    });
    for (const r of [body, cab, hl, tl]) r.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, vs.length]} castShadow><boxGeometry /><meshStandardMaterial roughness={0.35} metalness={0.4} /></instancedMesh>
      <instancedMesh ref={cab} args={[undefined, undefined, vs.length]}><boxGeometry /><meshStandardMaterial roughness={0.2} metalness={0.6} /></instancedMesh>
      <instancedMesh ref={hl} args={[undefined, hlMat, vs.length]}><boxGeometry /></instancedMesh>
      <instancedMesh ref={tl} args={[undefined, tlMat, vs.length]}><boxGeometry /></instancedMesh>
    </group>
  );
}

/** Pedestrians on the sidewalk navigation graph (cross only on crosswalks when traffic is red). Hidden when the camera is far. */
export function Pedestrians({ count }: { count: number }) {
  const g = useMemo(buildPedGraph, []);
  const ps = useMemo(() => spawnPeds(g, count, rng(11)), [g, count]);
  const rnd = useMemo(() => rng(99), []);
  const body = useRef<THREE.InstancedMesh>(null!), head = useRef<THREE.InstancedMesh>(null!);
  const { camera } = useThree();
  useLayoutEffect(() => {
    const c = new THREE.Color(), r = rng(4), shirts = ["#2563eb", "#dc2626", "#16a34a", "#f59e0b", "#334155", "#f8fafc", "#7c3aed", "#0891b2"];
    ps.forEach((_, i) => { body.current.setColorAt(i, c.set(shirts[Math.floor(r() * shirts.length)])); head.current.setColorAt(i, c.set(["#f1c27d", "#c68642", "#8d5524", "#ffdbac"][Math.floor(r() * 4)])); });
    body.current.instanceColor!.needsUpdate = head.current.instanceColor!.needsUpdate = true;
  }, [ps]);
  const m = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []), up = new THREE.Vector3(0, 1, 0);
  const v = useMemo(() => new THREE.Vector3(), []), one = new THREE.Vector3(1, 1, 1);
  useFrame((_, dt) => {
    stepPeds(g, ps, sim.t, Math.min(dt, 0.1) * (sim.paused ? 0 : 1), rnd);
    const visible = camera.position.y < 330;                     // LOD: people only when the camera is close enough to see them
    body.current.visible = head.current.visible = visible;
    if (!visible) return;
    ps.forEach((p, i) => {
      const [x, z, yaw] = pedPos(g, p); q.setFromAxisAngle(up, yaw);
      const bob = p.waiting ? 0 : Math.abs(Math.sin(sim.t * 7 + i)) * 0.08;
      m.compose(v.set(x, 0.85 + bob, z), q, one); body.current.setMatrixAt(i, m);
      m.compose(v.set(x, 1.85 + bob, z), q, one); head.current.setMatrixAt(i, m);
    });
    body.current.instanceMatrix.needsUpdate = head.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={body} args={[undefined, undefined, ps.length]}><cylinderGeometry args={[0.28, 0.34, 1.6, 6]} /><meshStandardMaterial roughness={0.8} /></instancedMesh>
      <instancedMesh ref={head} args={[undefined, undefined, ps.length]}><sphereGeometry args={[0.24, 8, 6]} /><meshStandardMaterial roughness={0.7} /></instancedMesh>
    </group>
  );
}

/** Freight train on the northern rail line between the port and the industrial district. */
export function Train() {
  const g = useRef<THREE.Group>(null!);
  const rails = useMemo(() => {
    const p: Part[] = [box(WORLD.maxX - COAST_X + 40, 0.3, 4, (WORLD.maxX + COAST_X) / 2 - 20, 0, RAIL_Z, "rail")];
    for (let x = COAST_X - 40; x < WORLD.maxX; x += 2.5) p.push(box(0.4, 0.15, 3.2, x, 0.3, RAIL_Z, "wood"));
    p.push(box(WORLD.maxX - COAST_X + 40, 0.18, 0.2, (WORLD.maxX + COAST_X) / 2 - 20, 0.45, RAIL_Z - 0.75, "metal"),
           box(WORLD.maxX - COAST_X + 40, 0.18, 0.2, (WORLD.maxX + COAST_X) / 2 - 20, 0.45, RAIL_Z + 0.75, "metal"));
    return mergeParts(p);
  }, []);
  const cars = 10;
  useFrame(() => {
    const L = WORLD.maxX - COAST_X + 120, f = (sim.t * 0.012) % 2, u = f < 1 ? f : 2 - f;
    g.current.position.x = COAST_X - 80 + u * L; g.current.rotation.y = f < 1 ? 0 : Math.PI;
  });
  return (
    <group>
      {rails.map(({ m, g: geo }) => <mesh key={m} geometry={geo} material={mats()[m]} receiveShadow />)}
      <group ref={g} position={[0, 0, RAIL_Z]}>
        <mesh position={[0, 2.4, 0]} castShadow material={mats().yellow}><boxGeometry args={[14, 3.8, 3]} /></mesh>
        <mesh position={[4, 4.8, 0]} material={mats().darkMetal}><boxGeometry args={[4, 1.2, 2.8]} /></mesh>
        {Array.from({ length: cars }, (_, i) => (
          <mesh key={i} position={[-10 - i * 13, 2.6, 0]} castShadow material={[mats().red, mats().corrugated, mats().darkMetal][i % 3]}>
            <boxGeometry args={[12, 3.6, 2.8]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Delivery drones flying between the tower and district buildings. */
export function Drones() {
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    g.current.children.forEach((d, i) => {
      const a = sim.t * (0.08 + i * 0.01) + i * 1.7, r = 70 + i * 22;
      d.position.set(Math.cos(a) * r, 55 + Math.sin(sim.t * 0.7 + i) * 6 + i * 4, Math.sin(a) * r * 0.8);
      d.rotation.y = -a;
    });
  });
  return (
    <group ref={g}>
      {Array.from({ length: 6 }, (_, i) => (
        <group key={i}>
          <mesh material={mats().darkMetal}><boxGeometry args={[1.6, 0.4, 1.6]} /></mesh>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], k) => <mesh key={k} position={[x, 0.2, z]} material={mats().metal}><cylinderGeometry args={[0.55, 0.55, 0.05, 10]} /></mesh>)}
          <mesh position={[0, -0.3, 0]} material={mats().blueLight}><sphereGeometry args={[0.18, 8, 6]} /></mesh>
        </group>
      ))}
    </group>
  );
}

/** Chimney and cooling-tower smoke (visual). */
export function Smoke({ sources }: { sources: [number, number, number][] }) {
  const inst = useRef<THREE.InstancedMesh>(null!), per = 6;
  const m = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []), s = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!inst.current) return;
    sources.forEach(([x, y, z], si) => {
      for (let k = 0; k < per; k++) {
        const f = (sim.t * 0.12 + k / per + si * 0.37) % 1, r = 2 + f * 7;
        m.compose(v.set(x + f * 14, y + f * 26, z + Math.sin(f * 6 + si) * 2), q, s.set(r, r * 0.8, r)); inst.current.setMatrixAt(si * per + k, m);
      }
    });
    inst.current.instanceMatrix.needsUpdate = true;
  });
  if (!sources.length) return null;
  return (
    <instancedMesh ref={inst} args={[undefined, undefined, sources.length * per]}>
      <sphereGeometry args={[1, 10, 8]} /><meshStandardMaterial color="#eef1f4" transparent opacity={0.55} depthWrite={false} roughness={1} />
    </instancedMesh>
  );
}
