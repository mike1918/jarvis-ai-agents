import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { COAST_X, WORLD } from "./plan";
import { mats, rng, setNight } from "./kit";
import { sim, step } from "./sim";
import { useWorld } from "./store";

const DAY = new THREE.Color("#8fc6ee"), DUSK = new THREE.Color("#f08a5d"), NIGHT = new THREE.Color("#0a1024"), DAWN = new THREE.Color("#f4b28a");
const RAIN = new THREE.Color("#5b6573");

/** Sun, moon, sky, fog, night lighting. Drives the visual clock. */
export function Sky() {
  const sun = useRef<THREE.DirectionalLight>(null!), moon = useRef<THREE.DirectionalLight>(null!), hemi = useRef<THREE.HemisphereLight>(null!);
  const { scene } = useThree(); const c = useMemo(() => new THREE.Color(), []);
  const weather = useWorld((s) => s.weather);
  useLayoutEffect(() => { scene.background = new THREE.Color(); scene.fog = new THREE.Fog("#8fc6ee", 380, 1300); }, [scene]);
  useFrame((_, dt) => {
    step(Math.min(dt, 0.1));
    const s = sim.sun, morning = sim.hours < 12;
    c.copy(NIGHT).lerp(DAY, s.day).lerp(morning ? DAWN : DUSK, s.twilight * 0.6);
    if (weather === "rain") c.lerp(RAIN, 0.55 * s.day + 0.2);
    (scene.background as THREE.Color).copy(c); (scene.fog as THREE.Fog).color.copy(c);
    (scene.fog as THREE.Fog).far = weather === "rain" ? 800 : 1300;
    sun.current.position.set(s.dir.x * 500, Math.max(s.dir.y, -0.15) * 500, s.dir.z * 500 + 80);
    sun.current.intensity = Math.max(0, s.day) * (weather === "rain" ? 0.9 : 2.6);
    sun.current.color.set(s.twilight > 0.3 ? "#ffad6e" : "#fff2dc");
    moon.current.intensity = s.night * 0.45;
    hemi.current.intensity = 0.28 + s.day * 0.6;
    setNight(s.night);
  });
  const hi = sim.quality === "high";
  return (
    <>
      <hemisphereLight ref={hemi} args={["#d4e9ff", "#7a6a55", 0.6]} />
      <directionalLight ref={sun} castShadow={hi} shadow-mapSize={[2048, 2048]} shadow-camera-left={-420} shadow-camera-right={420}
        shadow-camera-top={420} shadow-camera-bottom={-420} shadow-camera-far={1400} shadow-bias={-0.0005} />
      <directionalLight ref={moon} position={[-300, 400, -200]} color="#9db8ff" />
    </>
  );
}

export function Stars() {
  const ref = useRef<THREE.PointsMaterial>(null!);
  const geo = useMemo(() => {
    const r = rng(42), n = 1500, p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const th = r() * Math.PI * 2, ph = Math.acos(r() * 0.85 + 0.15), R = 2000; p.set([R * Math.sin(ph) * Math.cos(th), R * Math.cos(ph), R * Math.sin(ph) * Math.sin(th)], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); return g;
  }, []);
  useFrame(() => { ref.current.opacity = Math.max(0, sim.sun.night - 0.2); });
  return <points geometry={geo}><pointsMaterial ref={ref} size={2} sizeAttenuation={false} color="#fff" transparent fog={false} /></points>;
}

/** Clouds drifting from the sea; darker and denser in rain. */
export function Clouds() {
  const g = useRef<THREE.Group>(null!), mat = useRef<THREE.MeshStandardMaterial>(null!);
  const weather = useWorld((s) => s.weather);
  const puffs = useMemo(() => {
    const r = rng(8), out: { x: number; y: number; z: number; s: number }[] = [];
    for (let c = 0; c < 14; c++) { const cx = (r() - 0.5) * 1400, cz = (r() - 0.5) * 1100, y = 180 + r() * 70;
      for (let k = 0; k < 5; k++) out.push({ x: cx + (r() - 0.5) * 60, y: y + r() * 12, z: cz + (r() - 0.5) * 30, s: 18 + r() * 20 }); }
    return out;
  }, []);
  const inst = useRef<THREE.InstancedMesh>(null!);
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    puffs.forEach((p, i) => { m.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(p.s, p.s * 0.45, p.s * 0.8)); inst.current.setMatrixAt(i, m); });
    inst.current.instanceMatrix.needsUpdate = true;
  }, [puffs]);
  useFrame(() => {
    g.current.position.x = ((sim.t * 4) % 1400) - 700;
    mat.current.color.set(weather === "rain" ? "#6b7380" : "#ffffff").multiplyScalar(0.35 + sim.sun.day * 0.65);
    mat.current.opacity = weather === "clear" ? 0.25 : weather === "rain" ? 0.95 : 0.75;
  });
  return (
    <group ref={g}>
      <instancedMesh ref={inst} args={[undefined, undefined, puffs.length]}>
        <sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial ref={mat} transparent depthWrite={false} roughness={1} />
      </instancedMesh>
    </group>
  );
}

/** Decorative rain (visual only). */
export function Rain() {
  const weather = useWorld((s) => s.weather);
  const ref = useRef<THREE.LineSegments>(null!);
  const geo = useMemo(() => {
    const r = rng(3), n = 2500, p = new Float32Array(n * 6);
    for (let i = 0; i < n; i++) { const x = (r() - 0.5) * 700, y = r() * 220, z = (r() - 0.5) * 700; p.set([x, y, z, x - 0.4, y - 3, z], i * 6); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); return g;
  }, []);
  useFrame((_, dt) => { if (ref.current) ref.current.position.y = -((sim.t * 60) % 220); void dt; });
  if (weather !== "rain") return null;
  return <lineSegments ref={ref} geometry={geo}><lineBasicMaterial color="#aab8c8" transparent opacity={0.45} /></lineSegments>;
}

/** Mediterranean with animated waves, beach and land. */
export function Ground() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(2400, 2400, 100, 100); g.rotateX(-Math.PI / 2); g.translate(COAST_X - 1200 + 10, -0.8, 0); return g;
  }, []);
  const base = useMemo(() => Float32Array.from(geo.attributes.position.array as Float32Array), [geo]);
  const sea = useRef<THREE.MeshStandardMaterial>(null!);
  const frame = useRef(0);
  useFrame(() => {
    if (sim.quality === "low" && (frame.current++ & 1)) return;       // phones: animate waves every other frame
    const p = geo.attributes.position as THREE.BufferAttribute, a = p.array as Float32Array, t = sim.t;
    for (let i = 0; i < a.length; i += 3) a[i + 1] = -0.8 + Math.sin(base[i] * 0.04 + t * 1.2) * 0.4 + Math.cos(base[i + 2] * 0.06 + t * 0.8) * 0.3;
    p.needsUpdate = true; geo.computeVertexNormals();
    sea.current.color.set("#0b2236").lerp(new THREE.Color("#1f8fc4"), sim.sun.day);
  });
  const w = WORLD.maxX - COAST_X + 400, d = WORLD.maxZ - WORLD.minZ + 400;
  return (
    <group>
      <mesh geometry={geo} receiveShadow><meshStandardMaterial ref={sea} roughness={0.22} metalness={0.25} /></mesh>
      <mesh rotation-x={-Math.PI / 2} position={[COAST_X + w / 2, 0, (WORLD.minZ + WORLD.maxZ) / 2]} receiveShadow material={mats().paver}>
        <planeGeometry args={[w, d]} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[COAST_X + 7, 0.02, 150]} receiveShadow material={mats().sand}>
        <planeGeometry args={[14, 180]} />
      </mesh>
    </group>
  );
}
