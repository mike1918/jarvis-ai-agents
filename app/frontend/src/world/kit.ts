import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/* =====================  procedural textures (no image files; consistent scale: 1 texture tile = TILE metres)  ===================== */
export const TILE = 8;

function canvas(size = 256) {
  const c = document.createElement("canvas"); c.width = c.height = size; return [c, c.getContext("2d")!] as const;
}
function tex(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; return t;
}
function rnd(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

/** Facade with a window grid. `lit` produces the matching emissive map (random lit windows). */
function windowsTex(kind: "concrete" | "glass" | "brick" | "lab", lit: boolean, seed: number) {
  const [c, g] = canvas(256); const r = rnd(seed);
  const base = { concrete: "#9a9a94", glass: "#2b3646", brick: "#8a4b36", lab: "#b9bec4" }[kind];
  g.fillStyle = lit ? "#000" : base; g.fillRect(0, 0, 256, 256);
  if (!lit && kind === "brick") {
    g.fillStyle = "rgba(40,20,10,.35)";
    for (let y = 0; y < 256; y += 8) { g.fillRect(0, y, 256, 1); for (let x = (y / 8) % 2 ? 0 : 8; x < 256; x += 16) g.fillRect(x, y, 1, 8); }
  }
  if (!lit && kind === "concrete") { g.fillStyle = "rgba(0,0,0,.18)"; for (let x = 0; x < 256; x += 64) g.fillRect(x, 0, 2, 256); for (let y = 0; y < 256; y += 64) g.fillRect(0, y, 256, 2); }
  const cols = 4, rows = 4, cw = 256 / cols, ch = 256 / rows; // 2 m per window bay, 2 m... (TILE=8 m → 4 bays × 4 floors at 2 m; we scale v by floor height)
  for (let yy = 0; yy < rows; yy++)
    for (let xx = 0; xx < cols; xx++) {
      const x = xx * cw, y = yy * ch, on = r();
      if (kind === "glass") {
        if (lit) { if (on < 0.66) continue; g.fillStyle = on > 0.9 ? "#9fd8ff" : "#f6c98a"; g.fillRect(x + 6, y + 14, cw - 12, ch - 28); }
        else { g.fillStyle = "#4f6378"; g.fillRect(x + 2, y + 4, cw - 4, ch - 8); g.fillStyle = "#c9b38a"; g.fillRect(x, y, cw, 3); g.fillRect(x, y, 3, ch); }
      } else {
        if (lit) { if (on < 0.62) continue; g.fillStyle = on > 0.93 ? "#a9dcff" : on > 0.8 ? "#ffd59a" : "#e9a95a"; g.fillRect(x + 18, y + 18, cw - 36, ch - 34); }
        else { g.fillStyle = "#2a3440"; g.fillRect(x + 18, y + 18, cw - 36, ch - 34); g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(x + 15, y + ch - 15, cw - 30, 3);
               g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x + 16, y + 16, cw - 32, 2); }
      }
    }
  return tex(c, !lit);
}
function towerTex(lit: boolean) {
  const [c, g] = canvas(256); g.fillStyle = lit ? "#000" : "#1a2433"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) { g.fillStyle = lit ? "#2a8cff" : "#0e1520"; g.fillRect(0, y, 256, lit ? 2 : 3); }
  for (let x = 0; x < 256; x += 64) { g.fillStyle = lit ? "#000" : "#c9a14a"; g.fillRect(x, 0, 3, 256); }
  if (lit) { const r = rnd(5); for (let i = 0; i < 40; i++) { g.fillStyle = r() > 0.5 ? "#ffd08a" : "#9fd8ff"; g.fillRect(Math.floor(r() * 4) * 64 + 8, Math.floor(r() * 8) * 32 + 8, 48, 18); } }
  return tex(c, !lit);
}
function corrugatedTex() {
  const [c, g] = canvas(128); g.fillStyle = "#8f959b"; g.fillRect(0, 0, 128, 128);
  for (let x = 0; x < 128; x += 8) { g.fillStyle = "#a7adb3"; g.fillRect(x, 0, 4, 128); g.fillStyle = "#757b81"; g.fillRect(x + 4, 0, 1, 128); }
  return tex(c);
}
function solidTex(color: string, noise = 0.08, seed = 3) {
  const [c, g] = canvas(64); g.fillStyle = color; g.fillRect(0, 0, 64, 64); const r = rnd(seed);
  for (let i = 0; i < 500; i++) { g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${noise * r()})`; g.fillRect(r() * 64, r() * 64, 2, 2); }
  return tex(c);
}
function gridTex(base: string, line: string, step: number, extra?: (g: CanvasRenderingContext2D) => void) {
  const [c, g] = canvas(128); g.fillStyle = base; g.fillRect(0, 0, 128, 128); g.fillStyle = line;
  for (let i = 0; i < 128; i += step) { g.fillRect(0, i, 128, 1); g.fillRect(i, 0, 1, 128); }
  extra?.(g); return tex(c);
}
function paverTex() {
  const [c, g] = canvas(128); g.fillStyle = "#c9bfae"; g.fillRect(0, 0, 128, 128); g.fillStyle = "rgba(0,0,0,.12)";
  for (let i = 0; i < 128; i += 16) { g.fillRect(0, i, 128, 1); g.fillRect(i, 0, 1, 128); }
  return tex(c);
}

/* =====================  shared materials  ===================== */
export type Mat =
  | "concrete" | "glass" | "brick" | "lab" | "corrugated" | "roof" | "darkMetal" | "metal" | "gold" | "blueLight" | "warmLight"
  | "towerGlass" | "floorTile" | "carpet" | "epoxy" | "white" | "red" | "pipe" | "yellow" | "screen" | "wood" | "plant" | "trunk" | "glassClear" | "water" | "asphalt" | "paver" | "grass" | "sand" | "rail";

let _m: Record<Mat, THREE.Material> | null = null;
export function mats(): Record<Mat, THREE.Material> {
  if (_m) return _m;
  const facade = (k: "concrete" | "glass" | "brick" | "lab", seed: number, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) =>
    new THREE.MeshStandardMaterial({ map: windowsTex(k, false, seed), emissiveMap: windowsTex(k, true, seed + 7), emissive: new THREE.Color("#ffd8a0"),
      emissiveIntensity: 0, roughness: k === "glass" ? 0.25 : 0.85, metalness: k === "glass" ? 0.55 : 0.05, ...extra });
  _m = {
    concrete: facade("concrete", 11), glass: facade("glass", 23), brick: facade("brick", 37), lab: facade("lab", 41),
    corrugated: new THREE.MeshStandardMaterial({ map: corrugatedTex(), roughness: 0.6, metalness: 0.4 }),
    floorTile: new THREE.MeshStandardMaterial({ map: gridTex("#d9dcdf", "rgba(0,0,0,.12)", 32), roughness: 0.5 }),
    carpet: new THREE.MeshStandardMaterial({ map: gridTex("#5d6b7d", "rgba(255,255,255,.06)", 64), roughness: 1 }),
    epoxy: new THREE.MeshStandardMaterial({ map: gridTex("#7f8a83", "rgba(0,0,0,.08)", 64, (g) => { g.fillStyle = "#e0b020"; g.fillRect(0, 60, 128, 4); }), roughness: 0.4, metalness: 0.1 }),
    towerGlass: new THREE.MeshStandardMaterial({ map: towerTex(false), emissiveMap: towerTex(true), emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.5,
      roughness: 0.12, metalness: 0.85 }),
    roof: new THREE.MeshStandardMaterial({ map: solidTex("#4b4f55", 0.12), roughness: 1 }),
    darkMetal: new THREE.MeshStandardMaterial({ color: "#2c3138", roughness: 0.45, metalness: 0.8 }),
    metal: new THREE.MeshStandardMaterial({ color: "#9aa3ad", roughness: 0.35, metalness: 0.85 }),
    gold: new THREE.MeshStandardMaterial({ color: "#c9a14a", roughness: 0.3, metalness: 0.9, emissive: new THREE.Color("#6b4a10"), emissiveIntensity: 0.15 }),
    blueLight: new THREE.MeshStandardMaterial({ color: "#5cc8ff", emissive: new THREE.Color("#2aa8ff"), emissiveIntensity: 1.6, toneMapped: false }),
    warmLight: new THREE.MeshStandardMaterial({ color: "#ffe1a8", emissive: new THREE.Color("#ffb347"), emissiveIntensity: 0.2, toneMapped: false }),
    white: new THREE.MeshStandardMaterial({ color: "#e9e7e2", roughness: 0.8 }),
    red: new THREE.MeshStandardMaterial({ color: "#b3261e", roughness: 0.7 }),
    pipe: new THREE.MeshStandardMaterial({ color: "#b8bcc2", roughness: 0.3, metalness: 0.9 }),
    yellow: new THREE.MeshStandardMaterial({ color: "#f2a81d", roughness: 0.5, metalness: 0.3 }),
    screen: new THREE.MeshStandardMaterial({ color: "#0b1626", emissive: new THREE.Color("#3aa0ff"), emissiveIntensity: 0.9, toneMapped: false }),
    wood: new THREE.MeshStandardMaterial({ color: "#8a6a4a", roughness: 0.8 }),
    plant: new THREE.MeshStandardMaterial({ color: "#3f8a3a", roughness: 0.9 }),
    trunk: new THREE.MeshStandardMaterial({ color: "#6e5136", roughness: 1 }),
    glassClear: new THREE.MeshStandardMaterial({ color: "#a9d4ff", transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.2, depthWrite: false }),
    water: new THREE.MeshStandardMaterial({ color: "#3ab4e6", roughness: 0.15, metalness: 0.2, emissive: new THREE.Color("#1d7fb0"), emissiveIntensity: 0.25 }),
    asphalt: new THREE.MeshStandardMaterial({ map: solidTex("#3b3f45", 0.06, 9), roughness: 0.95 }),
    paver: new THREE.MeshStandardMaterial({ map: paverTex(), roughness: 0.9 }),
    grass: new THREE.MeshStandardMaterial({ map: solidTex("#5f8f45", 0.15, 5), roughness: 1 }),
    sand: new THREE.MeshStandardMaterial({ map: solidTex("#e6d3a2", 0.1, 6), roughness: 1 }),
    rail: new THREE.MeshStandardMaterial({ color: "#6b5d50", roughness: 0.9 }),
  };
  return _m;
}

/** Night lighting: windows, street lamps, accents follow the sun (night 0..1). */
export function setNight(night: number) {
  const m = mats();
  for (const k of ["concrete", "glass", "brick", "lab"] as Mat[]) (m[k] as THREE.MeshStandardMaterial).emissiveIntensity = 0.03 + night * 0.85;
  (m.towerGlass as THREE.MeshStandardMaterial).emissiveIntensity = 0.35 + night * 1.1;
  (m.warmLight as THREE.MeshStandardMaterial).emissiveIntensity = 0.15 + night * 2.4;
  (m.blueLight as THREE.MeshStandardMaterial).emissiveIntensity = 0.7 + night * 1.6;
}

/* =====================  geometry parts  ===================== */
export interface Part { g: THREE.BufferGeometry; m: Mat }

function scaleUV(g: THREE.BufferGeometry, su: number, sv: number) {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
}
/** Box with UVs in world units so facades tile consistently; floorH stretches window rows to the floor height. */
export function box(w: number, h: number, d: number, x: number, y: number, z: number, m: Mat, floorH = 0, rotY = 0): Part {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const vScale = floorH ? h / (floorH * 4) : h / TILE;
  const faces = [d, d, w, w, w, w]; // +x -x +y -y +z -z  (u extent)
  for (let f = 0; f < 6; f++)
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      if (f === 2 || f === 3) uv.setXY(i, uv.getX(i) * w / TILE, uv.getY(i) * d / TILE);
      else uv.setXY(i, uv.getX(i) * faces[f] / TILE, uv.getY(i) * vScale);
    }
  if (rotY) g.rotateY(rotY);
  g.translate(x, y + h / 2, z);
  return { g, m };
}
export function cyl(rt: number, rb: number, h: number, x: number, y: number, z: number, m: Mat, seg = 12, rotX = 0, rotZ = 0): Part {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg); scaleUV(g, (Math.PI * 2 * rb) / TILE, h / TILE);
  if (rotX) g.rotateX(rotX); if (rotZ) g.rotateZ(rotZ);
  g.translate(x, y + (rotX || rotZ ? 0 : h / 2), z); return { g, m };
}
export function sphere(r: number, x: number, y: number, z: number, m: Mat, half = false): Part {
  const g = new THREE.SphereGeometry(r, 20, 12, 0, Math.PI * 2, 0, half ? Math.PI / 2 : Math.PI); g.translate(x, y, z); return { g, m };
}
export function torus(r: number, t: number, x: number, y: number, z: number, m: Mat): Part {
  const g = new THREE.TorusGeometry(r, t, 8, 40); g.rotateX(Math.PI / 2); g.translate(x, y, z); return { g, m };
}
/** Pipe from a to b (horizontal or vertical runs). */
export function pipe(a: [number, number, number], b: [number, number, number], r: number, m: Mat = "pipe"): Part {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b), len = va.distanceTo(vb);
  const g = new THREE.CylinderGeometry(r, r, len, 8);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize()));
  const mid = va.add(vb).multiplyScalar(0.5); g.translate(mid.x, mid.y, mid.z); return { g, m };
}

/** Merge parts into one geometry per material (few draw calls per building/district). */
export function mergeParts(parts: Part[]) {
  const by = new Map<Mat, THREE.BufferGeometry[]>();
  for (const p of parts) {
    const g = p.g.index ? p.g.toNonIndexed() : p.g;
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
    if (!by.has(p.m)) by.set(p.m, []);
    by.get(p.m)!.push(g);
  }
  const out: { m: Mat; g: THREE.BufferGeometry }[] = [];
  by.forEach((gs, m) => { const g = mergeGeometries(gs); if (g) { g.computeBoundingSphere(); out.push({ m, g }); } });
  return out;
}

export function translateParts(parts: Part[], x: number, y: number, z: number, rotY = 0) {
  for (const p of parts) { if (rotY) p.g.rotateY(rotY); p.g.translate(x, y, z); }
  return parts;
}

/** Deterministic random generator so the city is identical on every load and device. */
export function rng(seed: number) {
  let s = seed % 2147483647; if (s <= 0) s += 2147483646;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

const _labels = new Map<string, THREE.CanvasTexture>();
export function labelTexture(lines: string[], color = "#e2f3ff") {
  const key = lines.join("|") + color; const hit = _labels.get(key); if (hit) return hit;
  const c = document.createElement("canvas"), g = c.getContext("2d")!, fs = 44;
  g.font = `700 ${fs}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
  const w = Math.max(...lines.map((l, i) => g.measureText(l).width * (i ? 0.72 : 1))) + 48;
  c.width = Math.ceil(w); c.height = Math.ceil(fs * 1.3 * lines.length + 26);
  g.fillStyle = "rgba(8,15,30,0.82)"; g.beginPath(); g.roundRect(0, 0, c.width, c.height, 20); g.fill();
  g.strokeStyle = color; g.globalAlpha = 0.5; g.lineWidth = 3; g.stroke(); g.globalAlpha = 1;
  lines.forEach((l, i) => {
    g.font = `${i ? 500 : 700} ${i ? fs * 0.72 : fs}px system-ui, -apple-system, Segoe UI, Roboto, sans-serif`;
    g.fillStyle = i ? "#a8b8cc" : color; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(l, c.width / 2, 14 + fs * 0.65 + i * fs * 1.25);
  });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.userData = { aspect: c.width / c.height }; _labels.set(key, t); return t;
}

/** JARVIS emblem: chevron + wordmark, emissive blue (generic shape, no third-party branding). */
let _logo: THREE.CanvasTexture | null = null;
export function logoTexture() {
  if (_logo) return _logo;
  const c = document.createElement("canvas"); c.width = 512; c.height = 640; const g = c.getContext("2d")!;
  g.clearRect(0, 0, 512, 640); g.lineJoin = "round"; g.strokeStyle = "#7fd6ff"; g.lineWidth = 46; g.shadowColor = "#2aa8ff"; g.shadowBlur = 40;
  g.beginPath(); g.moveTo(96, 440); g.lineTo(256, 90); g.lineTo(416, 440); g.stroke();
  g.lineWidth = 30; g.beginPath(); g.moveTo(186, 440); g.lineTo(256, 290); g.lineTo(326, 440); g.stroke();
  g.shadowBlur = 20; g.fillStyle = "#d7f1ff"; g.font = "800 92px system-ui, sans-serif"; g.textAlign = "center"; g.fillText("JARVIS", 256, 580);
  _logo = new THREE.CanvasTexture(c); _logo.colorSpace = THREE.SRGBColorSpace; return _logo;
}
