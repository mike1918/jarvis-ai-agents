import * as THREE from "three";
import { jerusalemHours, sunState } from "../sim/clock";

/**
 * Mutable simulation state shared by every 3D component (read in useFrame, never triggers React re-renders).
 * The DOM clock reads it at a low rate.
 */
export const sim = {
  hours: jerusalemHours(),
  speed: 120, // simulated seconds per real second (2 sim-minutes per second)
  live: false,
  paused: false,
  sun: sunState(jerusalemHours()),
  t: 0, // seconds since start (animation time, scaled by traffic speed)
  quality: "high" as "high" | "low",
};

export function step(dt: number) {
  if (sim.live) sim.hours = jerusalemHours();
  else if (!sim.paused) sim.hours = (sim.hours + (dt * sim.speed) / 3600) % 24;
  sim.sun = sunState(sim.hours);
  // traffic and ships move faster when time runs faster, but stay watchable
  const k = sim.paused ? 0 : Math.min(6, 1 + Math.log10(Math.max(1, sim.live ? 1 : sim.speed)));
  sim.t += dt * k;
}

function cellTexture(lit: boolean, seed: number) {
  // 8x8 window cells; facade map (wall + dark glass) or emissive map (random lit windows)
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  g.fillStyle = lit ? "#000" : "#f3efe6";
  g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      const on = rnd();
      if (lit) {
        if (on < 0.55) continue;
        g.fillStyle = on > 0.9 ? "#9fd3ff" : on > 0.75 ? "#ffe2a8" : "#ffc977";
      } else {
        g.fillStyle = "#5b6b7a";
      }
      g.fillRect(x * 32 + 7, y * 32 + 9, 18, 15);
      if (!lit) { g.fillStyle = "#e7e1d3"; g.fillRect(x * 32 + 5, y * 32 + 24, 22, 3); } // balcony line
    }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = lit ? THREE.NoColorSpace : THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

let _mats: ReturnType<typeof createMaterials> | null = null;
function createMaterials() {
  const facade = new THREE.MeshStandardMaterial({
    map: cellTexture(false, 7), emissiveMap: cellTexture(true, 11), emissive: new THREE.Color("#ffd9a0"),
    emissiveIntensity: 0, vertexColors: true, roughness: 0.85,
  });
  const lamp = new THREE.MeshStandardMaterial({ color: "#fff3c4", emissive: new THREE.Color("#ffcf73"), emissiveIntensity: 0 });
  const headlight = new THREE.MeshBasicMaterial({ color: "#fff6d5", transparent: true, opacity: 0 });
  const taillight = new THREE.MeshBasicMaterial({ color: "#ff3b30", transparent: true, opacity: 0 });
  return { facade, lamp, headlight, taillight };
}
export const materials = () => (_mats ??= createMaterials());

/** Called every frame by the sky controller: night lights follow the sun. */
export function updateNightMaterials(night: number) {
  const m = materials();
  m.facade.emissiveIntensity = 0.05 + night * 1.15;
  m.lamp.emissiveIntensity = night * 2.2;
  m.headlight.opacity = 0.25 + night * 0.75;
  m.taillight.opacity = 0.2 + night * 0.8;
}

const _labelCache = new Map<string, THREE.CanvasTexture>();
export function labelTexture(lines: string[], color = "#e2f3ff", bg = "rgba(8,15,30,0.78)") {
  const key = lines.join("|") + color;
  const hit = _labelCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  const g = c.getContext("2d")!;
  const fs = 44;
  g.font = `600 ${fs}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  const w = Math.max(...lines.map((l, i) => g.measureText(l).width * (i ? 0.7 : 1))) + 48;
  c.width = Math.ceil(w); c.height = Math.ceil(fs * 1.3 * lines.length + 26);
  g.fillStyle = bg;
  g.beginPath(); g.roundRect(0, 0, c.width, c.height, 22); g.fill();
  lines.forEach((l, i) => {
    g.font = `${i ? 500 : 700} ${i ? fs * 0.7 : fs}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
    g.fillStyle = i ? "#9fb3c8" : color;
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(l, c.width / 2, 14 + fs * 0.65 + i * fs * 1.25);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.userData = { aspect: c.width / c.height };
  _labelCache.set(key, t);
  return t;
}

/** Deterministic pseudo-random generator so the city looks the same on every load. */
export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

/* ---------- city layout (local coordinates; the whole city group is rotated to follow Ashdod's NNE coastline) ---------- */
export const COAST_X = -100; // sea is x < COAST_X
export const BEACH_W = 14;
export const AVENUES = [-78, -30, 20, 70, 120, 170, 220]; // north–south roads (x)
export const STREETS = [-150, -100, -50, 0, 50, 100, 150, 200]; // west–east roads (z)
export const LAND = { minX: COAST_X, maxX: 250, minZ: -250, maxZ: 240 };
export const ROAD_W = 7;
export const TECH = { cx: 45, cz: 25, r: 58 }; // tech park around the JARVIS tower
export const PORT = { minZ: -250, maxZ: -165 };
export const MARINA = { z0: 40, z1: 110 };
