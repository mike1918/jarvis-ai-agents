import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BEACH_W, COAST_X, LAND, MARINA, PORT, materials, rng, sim, step, updateNightMaterials } from "./env";

const DAY_SKY = new THREE.Color("#8ec9f0");
const DUSK_SKY = new THREE.Color("#f29a6b");
const NIGHT_SKY = new THREE.Color("#060b1a");
const SEA_DAY = new THREE.Color("#1f8fc4");
const SEA_NIGHT = new THREE.Color("#06182b");

/** Sun, moon, sky colour, fog and all night-time lighting. Drives the 4D clock (sim.step). */
export function SkyController() {
  const sun = useRef<THREE.DirectionalLight>(null!);
  const moon = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);
  const { scene } = useThree();
  const col = useMemo(() => new THREE.Color(), []);
  useMemo(() => { scene.background = new THREE.Color(); scene.fog = new THREE.Fog("#8ec9f0", 260, 900); }, [scene]);
  useFrame((_, dt) => {
    step(Math.min(dt, 0.1));
    const s = sim.sun;
    col.copy(NIGHT_SKY).lerp(DAY_SKY, s.day).lerp(DUSK_SKY, s.twilight * 0.55);
    (scene.background as THREE.Color).copy(col);
    (scene.fog as THREE.Fog).color.copy(col);
    sun.current.position.set(s.dir.x * 300, Math.max(s.dir.y, -0.2) * 300, s.dir.z * 300);
    sun.current.intensity = Math.max(0, s.day) * 2.4;
    sun.current.color.set(s.twilight > 0.3 ? "#ffb27a" : "#fff4e0");
    moon.current.intensity = s.night * 0.35;
    hemi.current.intensity = 0.25 + s.day * 0.55;
    updateNightMaterials(s.night);
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={["#cfe8ff", "#c9b58f", 0.6]} />
      <directionalLight ref={sun} castShadow={sim.quality === "high"} shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-300} shadow-camera-right={300} shadow-camera-top={300} shadow-camera-bottom={-300}
        shadow-camera-far={900} shadow-bias={-0.0004} />
      <directionalLight ref={moon} position={[-200, 260, -120]} color="#9db8ff" />
    </>
  );
}

export function Stars() {
  const ref = useRef<THREE.PointsMaterial>(null!);
  const geo = useMemo(() => {
    const r = rng(42), n = 1400, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const th = r() * Math.PI * 2, ph = Math.acos(r() * 0.9 + 0.1), R = 1400;
      p.set([R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph), R * Math.sin(ph) * Math.sin(th)], i * 3);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); return g;
  }, []);
  useFrame(() => { ref.current.opacity = Math.max(0, sim.sun.night - 0.15); });
  return <points geometry={geo}><pointsMaterial ref={ref} size={2.2} sizeAttenuation={false} color="#ffffff" transparent fog={false} /></points>;
}

/** Mediterranean sea with animated waves (time component of the simulation). */
export function Sea() {
  const mesh = useRef<THREE.Mesh>(null!);
  const mat = useRef<THREE.MeshStandardMaterial>(null!);
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1400, 1400, 90, 90); g.rotateX(-Math.PI / 2);
    g.translate(COAST_X - 700 + 30, -0.6, 0); return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  useFrame(() => {
    const p = geo.attributes.position as THREE.BufferAttribute, a = p.array as Float32Array, t = sim.t;
    for (let i = 0; i < a.length; i += 3) {
      const x = base[i], z = base[i + 2];
      a[i + 1] = -0.6 + Math.sin(x * 0.05 + t * 1.3) * 0.35 + Math.cos(z * 0.07 + t * 0.9) * 0.25;
    }
    p.needsUpdate = true; geo.computeVertexNormals();
    mat.current.color.copy(SEA_NIGHT).lerp(SEA_DAY, sim.sun.day);
  });
  return <mesh ref={mesh} geometry={geo} receiveShadow><meshStandardMaterial ref={mat} roughness={0.25} metalness={0.15} /></mesh>;
}

/** Land, beach (Lido / promenade) and the green belt. */
export function Terrain() {
  const w = LAND.maxX - LAND.minX, d = LAND.maxZ - LAND.minZ;
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[LAND.minX + w / 2 + BEACH_W / 2, 0, LAND.minZ + d / 2]} receiveShadow>
        <planeGeometry args={[w - BEACH_W, d]} />
        <meshStandardMaterial color="#c9c2ae" roughness={1} />
      </mesh>
      {/* beach strip except where the port and marina are */}
      {[[PORT.maxZ, MARINA.z0], [MARINA.z1, LAND.maxZ]].map(([z0, z1], i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[COAST_X + BEACH_W / 2, 0.02, (z0 + z1) / 2]} receiveShadow>
          <planeGeometry args={[BEACH_W, z1 - z0]} />
          <meshStandardMaterial color="#ecd9a8" roughness={1} />
        </mesh>
      ))}
      {/* Lachish river park in the north */}
      <mesh rotation-x={-Math.PI / 2} position={[60, 0.03, -158]} receiveShadow>
        <planeGeometry args={[300, 12]} /><meshStandardMaterial color="#6f9f5a" roughness={1} />
      </mesh>
    </group>
  );
}

/** Date palms along the promenade and avenues. */
export function Palms() {
  const trunks = useRef<THREE.InstancedMesh>(null!);
  const crowns = useRef<THREE.InstancedMesh>(null!);
  const spots = useMemo(() => {
    const r = rng(9), s: [number, number, number][] = [];
    for (let z = PORT.maxZ + 6; z < LAND.maxZ - 6; z += 11) {
      if (z > MARINA.z0 - 4 && z < MARINA.z1 + 4) continue;
      s.push([COAST_X + BEACH_W + 2.5, z, 7 + r() * 4]);
    }
    for (let x = -60; x < 240; x += 16) if (Math.abs(x - 45) > 70) s.push([x, 5.5, 6 + r() * 3]); // boulevard palms
    return s;
  }, []);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    spots.forEach(([x, z, h], i) => {
      m.compose(new THREE.Vector3(x, h / 2, z), q, new THREE.Vector3(1, h, 1)); trunks.current.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(x, h, z), q, new THREE.Vector3(1, 1, 1)); crowns.current.setMatrixAt(i, m);
    });
    trunks.current.instanceMatrix.needsUpdate = true; crowns.current.instanceMatrix.needsUpdate = true;
  }, [spots]);
  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, spots.length]} castShadow>
        <cylinderGeometry args={[0.22, 0.32, 1, 6]} /><meshStandardMaterial color="#8a6a45" />
      </instancedMesh>
      <instancedMesh ref={crowns} args={[undefined, undefined, spots.length]} castShadow>
        <coneGeometry args={[2.4, 1.6, 7]} /><meshStandardMaterial color="#3f7d3a" />
      </instancedMesh>
    </group>
  );
}

export function useLampMaterial() { return materials().lamp; }
