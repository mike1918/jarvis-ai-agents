import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { COAST_X, MARINA, PORT, labelTexture, materials, rng, sim } from "./env";

/** Ashdod Port (north): breakwater, quays, container stacks, gantry cranes and moving cargo ships. */
export function Port() {
  const boxes = useRef<THREE.InstancedMesh>(null!);
  const stacks = useMemo(() => {
    const r = rng(31), out: [number, number, number, string][] = [];
    const cols = ["#c2410c", "#1d4ed8", "#15803d", "#b91c1c", "#a16207", "#0f766e", "#6b21a8", "#e5e7eb"];
    for (let x = -96; x < 30; x += 7)
      for (let z = PORT.minZ + 18; z < PORT.maxZ - 6; z += 3.2) {
        if (r() < 0.22) continue;
        const h = 1 + Math.floor(r() * 4);
        for (let k = 0; k < h; k++) out.push([x, 1.3 + k * 2.6, z, cols[Math.floor(r() * cols.length)]]);
      }
    return out;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(6, 2.5, 2.4), c = new THREE.Color();
    stacks.forEach(([x, y, z, col], i) => {
      m.compose(new THREE.Vector3(x, y, z), q, s); boxes.current.setMatrixAt(i, m); boxes.current.setColorAt(i, c.set(col));
    });
    boxes.current.instanceMatrix.needsUpdate = true; boxes.current.instanceColor!.needsUpdate = true;
  }, [stacks]);
  const cranes = [-150, -128, -106, -84].map((z) => ({ z }));
  const label = labelTexture(["Порт Ашдода", "инфраструктура и логистика"], "#fcd34d");
  return (
    <group>
      {/* port land and quay extending into the sea */}
      <mesh rotation-x={-Math.PI / 2} position={[-35, 0.04, (PORT.minZ + PORT.maxZ) / 2]} receiveShadow>
        <planeGeometry args={[150, PORT.maxZ - PORT.minZ]} /><meshStandardMaterial color="#9aa0a6" roughness={1} />
      </mesh>
      <mesh position={[COAST_X - 40, 0.6, -205]} receiveShadow castShadow>
        <boxGeometry args={[80, 1.6, 34]} /><meshStandardMaterial color="#8b9096" />
      </mesh>
      {/* main breakwater */}
      <mesh position={[COAST_X - 95, 1, -175]} rotation-y={0.35} castShadow>
        <boxGeometry args={[8, 3, 150]} /><meshStandardMaterial color="#7c7466" roughness={1} />
      </mesh>
      <instancedMesh ref={boxes} args={[undefined, undefined, stacks.length]} castShadow receiveShadow>
        <boxGeometry /><meshStandardMaterial roughness={0.7} />
      </instancedMesh>
      {cranes.map(({ z }, i) => <Crane key={i} x={COAST_X - 62} z={z - 60} phase={i} />)}
      <CargoShip pathR={260} speed={0.006} phase={0} />
      <CargoShip pathR={320} speed={0.004} phase={0.45} />
      <CargoShip pathR={380} speed={0.003} phase={0.8} />
      <sprite position={[-40, 32, -215]} scale={[34 * (label.userData.aspect ?? 3) / 3, 11, 1]}>
        <spriteMaterial map={label} depthTest={false} />
      </sprite>
    </group>
  );
}

function Crane({ x, z, phase }: { x: number; z: number; phase: number }) {
  const boom = useRef<THREE.Group>(null!);
  useFrame(() => { boom.current.position.z = Math.sin(sim.t * 0.25 + phase) * 6; });
  return (
    <group position={[x, 0, z]}>
      {[-5, 5].map((dz) => [-6, 6].map((dx) => (
        <mesh key={`${dx}${dz}`} position={[dx, 13, dz]} castShadow><boxGeometry args={[1, 26, 1]} /><meshStandardMaterial color="#d97706" /></mesh>
      )))}
      <mesh position={[-12, 26, 0]} castShadow><boxGeometry args={[46, 2, 2]} /><meshStandardMaterial color="#d97706" /></mesh>
      <group ref={boom}><mesh position={[-24, 20, 0]}><boxGeometry args={[3, 1.2, 3]} /><meshStandardMaterial color="#374151" /></mesh></group>
      <mesh position={[0, 27.6, 0]}><sphereGeometry args={[0.5, 8, 6]} /><primitive object={materials().lamp} attach="material" /></mesh>
    </group>
  );
}

/** A cargo ship sailing an ellipse between the open sea and the port entrance. */
function CargoShip({ pathR, speed, phase }: { pathR: number; speed: number; phase: number }) {
  const g = useRef<THREE.Group>(null!);
  const hull = useMemo(() => ["#7f1d1d", "#1e3a8a", "#14532d"][Math.floor(phase * 3) % 3], [phase]);
  useFrame(() => {
    const a = (phase + sim.t * speed) * Math.PI * 2;
    const x = COAST_X - 120 - Math.cos(a) * pathR * 0.5, z = -120 + Math.sin(a) * pathR;
    const nx = COAST_X - 120 - Math.cos(a + 0.01) * pathR * 0.5, nz = -120 + Math.sin(a + 0.01) * pathR;
    g.current.position.set(x, Math.sin(sim.t + phase * 9) * 0.2, z);
    g.current.rotation.y = Math.atan2(nx - x, nz - z);
  });
  return (
    <group ref={g}>
      <mesh position={[0, 1.5, 0]} castShadow><boxGeometry args={[9, 4, 46]} /><meshStandardMaterial color={hull} /></mesh>
      <mesh position={[0, 4.6, -16]} castShadow><boxGeometry args={[8, 6, 7]} /><meshStandardMaterial color="#f3f4f6" /></mesh>
      {[-8, -1, 6, 13].map((z, i) => (
        <mesh key={i} position={[0, 4.4, z]} castShadow><boxGeometry args={[7.6, 2.4, 6]} /><meshStandardMaterial color={["#c2410c", "#0f766e", "#1d4ed8", "#a16207"][i]} /></mesh>
      ))}
      <mesh position={[0, 8.2, -16]}><sphereGeometry args={[0.4, 8, 6]} /><primitive object={materials().lamp} attach="material" /></mesh>
    </group>
  );
}

/** The marina: curved breakwater, piers, bobbing yachts and two sailboats cruising along the coast. */
export function Marina() {
  const hulls = useRef<THREE.InstancedMesh>(null!);
  const masts = useRef<THREE.InstancedMesh>(null!);
  const boats = useMemo(() => {
    const r = rng(12), out: [number, number, number][] = [];
    for (let row = 0; row < 3; row++)
      for (let z = MARINA.z0 + 8; z < MARINA.z1 - 8; z += 5) out.push([COAST_X - 10 - row * 13 + (r() - 0.5), z + r(), r() * 6]);
    return out;
  }, []);
  const m = useMemo(() => new THREE.Matrix4(), []), q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []), s = useMemo(() => new THREE.Vector3(), []);
  const e = useMemo(() => new THREE.Euler(), []);
  useFrame(() => {
    boats.forEach(([x, z, ph], i) => {
      q.setFromEuler(e.set(Math.sin(sim.t * 1.1 + ph) * 0.05, Math.PI / 2, Math.cos(sim.t * 0.9 + ph) * 0.04));
      m.compose(v.set(x, 0.1 + Math.sin(sim.t * 1.5 + ph) * 0.15, z), q, s.set(1.6, 0.9, 4.2)); hulls.current.setMatrixAt(i, m);
      m.compose(v.set(x, 4, z), q, s.set(0.12, 7, 0.12)); masts.current.setMatrixAt(i, m);
    });
    hulls.current.instanceMatrix.needsUpdate = masts.current.instanceMatrix.needsUpdate = true;
  });
  const label = labelTexture(["Марина Ашдода", "яхты и набережная"], "#7dd3fc");
  return (
    <group>
      <mesh position={[COAST_X - 46, 1, (MARINA.z0 + MARINA.z1) / 2]} castShadow>
        <boxGeometry args={[5, 2.6, MARINA.z1 - MARINA.z0 + 6]} /><meshStandardMaterial color="#8a8070" roughness={1} />
      </mesh>
      <mesh position={[COAST_X - 24, 1, MARINA.z0 - 2]} castShadow><boxGeometry args={[48, 2.6, 5]} /><meshStandardMaterial color="#8a8070" /></mesh>
      <mesh position={[COAST_X - 18, 1, MARINA.z1 + 2]} castShadow><boxGeometry args={[36, 2.6, 5]} /><meshStandardMaterial color="#8a8070" /></mesh>
      {[0, 1, 2].map((row) => (
        <mesh key={row} position={[COAST_X - 16 - row * 13, 0.35, (MARINA.z0 + MARINA.z1) / 2]}>
          <boxGeometry args={[1.4, 0.4, MARINA.z1 - MARINA.z0 - 12]} /><meshStandardMaterial color="#b08b5a" />
        </mesh>
      ))}
      <instancedMesh ref={hulls} args={[undefined, undefined, boats.length]} castShadow>
        <boxGeometry /><meshStandardMaterial color="#f8fafc" />
      </instancedMesh>
      <instancedMesh ref={masts} args={[undefined, undefined, boats.length]}>
        <boxGeometry /><meshStandardMaterial color="#cbd5e1" />
      </instancedMesh>
      <SailBoat phase={0} /><SailBoat phase={0.5} />
      <sprite position={[COAST_X - 24, 22, MARINA.z0 + 34]} scale={[30 * (label.userData.aspect ?? 3) / 3, 10, 1]}>
        <spriteMaterial map={label} depthTest={false} />
      </sprite>
    </group>
  );
}

function SailBoat({ phase }: { phase: number }) {
  const g = useRef<THREE.Group>(null!);
  useFrame(() => {
    const f = (phase + sim.t * 0.01) % 1, z = -120 + Math.abs(f * 2 - 1) * 330, dir = f < 0.5 ? 1 : -1;
    g.current.position.set(COAST_X - 70 - phase * 30, Math.sin(sim.t * 1.4) * 0.2, z);
    g.current.rotation.y = dir > 0 ? 0 : Math.PI;
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.5, 0]}><boxGeometry args={[2, 1.2, 6]} /><meshStandardMaterial color="#ffffff" /></mesh>
      <mesh position={[0, 5, 0.5]} rotation-y={Math.PI / 2}>
        <coneGeometry args={[2.4, 8, 3]} /><meshStandardMaterial color="#f1f5f9" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}
