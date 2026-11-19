import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { AVENUES, BEACH_W, COAST_X, LAND, PORT, ROAD_W, STREETS, materials, rng, sim } from "./env";

const Z0 = PORT.maxZ + 2, Z1 = LAND.maxZ - 2;     // avenues run north–south
const X0 = COAST_X + BEACH_W, X1 = LAND.maxX - 2;  // streets run west–east

/** Road network: coastal boulevard + avenue/street grid, with sidewalks and street lamps. */
export function Roads() {
  const poles = useRef<THREE.InstancedMesh>(null!);
  const heads = useRef<THREE.InstancedMesh>(null!);
  const lamps = useMemo(() => {
    const out: [number, number][] = [];
    for (const x of AVENUES) for (let z = Z0 + 6; z < Z1; z += 22) out.push([x + ROAD_W / 2 + 1.2, z]);
    for (const z of STREETS) for (let x = X0 + 10; x < X1; x += 22) out.push([x, z + ROAD_W / 2 + 1.2]);
    return out;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), one = new THREE.Vector3(1, 1, 1);
    lamps.forEach(([x, z], i) => {
      m.compose(new THREE.Vector3(x, 2.5, z), q, one); poles.current.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(x, 5.1, z), q, one); heads.current.setMatrixAt(i, m);
    });
    poles.current.instanceMatrix.needsUpdate = heads.current.instanceMatrix.needsUpdate = true;
  }, [lamps]);
  return (
    <group>
      {AVENUES.map((x) => (
        <mesh key={`a${x}`} rotation-x={-Math.PI / 2} position={[x, 0.05, (Z0 + Z1) / 2]} receiveShadow>
          <planeGeometry args={[ROAD_W, Z1 - Z0]} /><meshStandardMaterial color="#3a3f47" roughness={0.95} />
        </mesh>
      ))}
      {STREETS.map((z) => (
        <mesh key={`s${z}`} rotation-x={-Math.PI / 2} position={[(X0 + X1) / 2, 0.06, z]} receiveShadow>
          <planeGeometry args={[X1 - X0, ROAD_W]} /><meshStandardMaterial color="#3a3f47" roughness={0.95} />
        </mesh>
      ))}
      {/* centre lines */}
      {AVENUES.map((x) => (
        <mesh key={`la${x}`} rotation-x={-Math.PI / 2} position={[x, 0.07, (Z0 + Z1) / 2]}>
          <planeGeometry args={[0.25, Z1 - Z0]} /><meshBasicMaterial color="#d8c27a" />
        </mesh>
      ))}
      <instancedMesh ref={poles} args={[undefined, undefined, lamps.length]}>
        <cylinderGeometry args={[0.08, 0.1, 5, 5]} /><meshStandardMaterial color="#5b6470" />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, lamps.length]} material={materials().lamp}>
        <sphereGeometry args={[0.35, 8, 6]} />
      </instancedMesh>
    </group>
  );
}

interface Car { axis: "x" | "z"; line: number; dir: 1 | -1; pos: number; speed: number; bus: boolean }

/** Moving traffic (cars and buses) with head/tail lights at night. */
export function Traffic({ count = 150 }: { count?: number }) {
  const bodies = useRef<THREE.InstancedMesh>(null!);
  const heads = useRef<THREE.InstancedMesh>(null!);
  const tails = useRef<THREE.InstancedMesh>(null!);
  const cars = useMemo<Car[]>(() => {
    const r = rng(77), out: Car[] = [];
    for (let i = 0; i < count; i++) {
      const av = r() < 0.55, dir = (r() < 0.5 ? 1 : -1) as 1 | -1;
      const line = av ? AVENUES[Math.floor(r() * AVENUES.length)] : STREETS[Math.floor(r() * STREETS.length)];
      out.push({ axis: av ? "z" : "x", line: line + dir * 1.7, dir, pos: r(), speed: 0.012 + r() * 0.012, bus: r() < 0.08 });
    }
    return out;
  }, [count]);
  useLayoutEffect(() => {
    const palette = ["#e5e7eb", "#111827", "#9ca3af", "#b91c1c", "#1d4ed8", "#f5f5f4", "#374151", "#0f766e"];
    const r = rng(5), c = new THREE.Color();
    cars.forEach((car, i) => bodies.current.setColorAt(i, c.set(car.bus ? "#22a06b" : palette[Math.floor(r() * palette.length)])));
    bodies.current.instanceColor!.needsUpdate = true;
  }, [cars]);
  const m = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const t = sim.t;
    cars.forEach((car, i) => {
      const len = car.axis === "z" ? Z1 - Z0 : X1 - X0, start = car.axis === "z" ? Z0 : X0;
      let f = (car.pos + t * car.speed * car.dir * (car.bus ? 0.7 : 1)) % 1; if (f < 0) f += 1;
      const p = start + f * len;
      const yaw = car.axis === "z" ? (car.dir > 0 ? 0 : Math.PI) : (car.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
      q.setFromAxisAngle(up, yaw);
      const L = car.bus ? 9 : 3.8;
      const x = car.axis === "z" ? car.line : p, z = car.axis === "z" ? p : car.line;
      m.compose(v.set(x, car.bus ? 1.4 : 0.75, z), q, s.set(car.bus ? 2.3 : 1.7, car.bus ? 2.6 : 1.2, L)); bodies.current.setMatrixAt(i, m);
      const fx = Math.sin(yaw) * (L / 2 + 0.05), fz = Math.cos(yaw) * (L / 2 + 0.05);
      m.compose(v.set(x + fx, 0.7, z + fz), q, s.set(1.4, 0.3, 0.1)); heads.current.setMatrixAt(i, m);
      m.compose(v.set(x - fx, 0.75, z - fz), q, s.set(1.4, 0.25, 0.1)); tails.current.setMatrixAt(i, m);
    });
    bodies.current.instanceMatrix.needsUpdate = heads.current.instanceMatrix.needsUpdate = tails.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <instancedMesh ref={bodies} args={[undefined, undefined, cars.length]} castShadow>
        <boxGeometry /><meshStandardMaterial roughness={0.4} metalness={0.3} />
      </instancedMesh>
      <instancedMesh ref={heads} args={[undefined, undefined, cars.length]} material={materials().headlight}><boxGeometry /></instancedMesh>
      <instancedMesh ref={tails} args={[undefined, undefined, cars.length]} material={materials().taillight}><boxGeometry /></instancedMesh>
    </group>
  );
}
