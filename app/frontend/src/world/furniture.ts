import * as THREE from "three";
import type { RoomKind, RoomSpec } from "./plan.ts";
import { box, cyl, pipe, rng, torus, type Mat, type Part } from "./kit.ts";

/** Static furniture for a room (local floor coordinates). Returns parts + seat positions for agent workplaces + animated props. */
export interface Seat { x: number; z: number; yaw: number }
export interface Anim { kind: "arm" | "conveyor" | "forklift" | "leds" | "brain" | "globe" | "robot"; x: number; z: number; w?: number; d?: number; color?: Mat }
export interface Furnished { parts: Part[]; seats: Seat[]; anims: Anim[]; staff: Seat[] }

const FLOOR_TINT: Record<RoomKind, Mat> = {
  lobby: "paver", reception: "floorTile", office: "carpet", meeting: "wood", server: "floorTile", lounge: "wood", kitchen: "floorTile",
  lab: "floorTile", robotics: "floorTile", "ai-core": "carpet", control: "carpet", owner: "wood", archive: "wood", observation: "paver",
  assembly: "epoxy", storage: "epoxy", machines: "epoxy", "security-ops": "carpet",
};

function desk(p: Part[], x: number, z: number, yaw: number) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const at = (dx: number, dz: number): [number, number] => [x + dx * c + dz * s, z - dx * s + dz * c];
  const g = new THREE.BoxGeometry(1.7, 0.08, 0.8); g.rotateY(yaw); g.translate(x, 0.76, z); p.push({ g, m: "white" });
  for (const dx of [-0.75, 0.75]) { const [lx, lz] = at(dx, 0); p.push(box(0.06, 0.74, 0.7, lx, 0, lz, "darkMetal", 0, yaw)); }
  for (const dx of [-0.38, 0.38]) { const [mx, mz] = at(dx, -0.25); p.push(box(0.62, 0.38, 0.04, mx, 0.95, mz, "screen", 0, yaw), box(0.06, 0.15, 0.06, mx, 0.8, mz, "darkMetal", 0, yaw)); }
  const [cx, cz] = at(0, 0.62), [bx, bz] = at(0, 0.9);
  p.push(box(0.55, 0.08, 0.55, cx, 0.45, cz, "darkMetal", 0, yaw), box(0.55, 0.6, 0.08, bx, 0.5, bz, "darkMetal", 0, yaw));
}
function plant(p: Part[], x: number, z: number) { p.push(cyl(0.3, 0.25, 0.5, x, 0, z, "concrete", 8)); const g = new THREE.IcosahedronGeometry(0.55, 0); g.translate(x, 1, z); p.push({ g, m: "plant" }); }
function sofa(p: Part[], x: number, z: number, yaw = 0) { p.push(box(2.2, 0.45, 0.9, x, 0, z, "wood", 0, yaw), box(2.2, 0.5, 0.25, x - Math.sin(yaw) * 0.35, 0.45, z - Math.cos(yaw) * 0.35, "wood", 0, yaw)); }
function screenWall(p: Part[], x0: number, x1: number, z: number, rows = 2) {
  for (let r = 0; r < rows; r++) for (let x = x0 + 1.2; x < x1 - 0.8; x += 2.3) p.push(box(2.1, 1.2, 0.08, x, 1.4 + r * 1.35, z, "screen"));
}

export function furnish(room: RoomSpec, seed: number): Furnished {
  const p: Part[] = [], seats: Seat[] = [], anims: Anim[] = [], staff: Seat[] = [];
  const { x, z, w, d, kind } = room, r = rng(seed), cx = x + w / 2, cz = z + d / 2;
  p.push(box(w - 0.1, 0.06, d - 0.1, cx, 0.31, cz, FLOOR_TINT[kind]));
  const inner = (fn: (px: number, pz: number) => void, stepX: number, stepZ: number, mx = 1.6, mz = 1.6) => {
    for (let px = x + mx; px <= x + w - mx; px += stepX) for (let pz = z + mz; pz <= z + d - mz; pz += stepZ) fn(px, pz);
  };
  const Y = 0.34; // floor top
  const lift = (parts: Part[]) => { for (const q of parts) q.g.translate(0, Y, 0); return parts; };
  const q: Part[] = [];
  switch (kind) {
    case "office": {
      inner((px, pz) => { desk(q, px, pz, 0); seats.push({ x: px, z: pz + 0.62, yaw: Math.PI }); desk(q, px, pz + 2.1, Math.PI); seats.push({ x: px, z: pz + 2.1 - 0.62, yaw: 0 }); }, 3.4, 5.6, 1.8, 1.8);
      for (let pz = z + 1; pz < z + d; pz += 4.6) plant(q, x + w - 0.8, pz);
      break;
    }
    case "meeting": {
      const tw = Math.max(2, w - 4), td = Math.max(1.2, Math.min(3, d - 3));
      q.push(box(tw, 0.08, td, cx, 0.76, cz, "wood"), box(0.4, 0.74, td * 0.6, cx, 0, cz, "darkMetal"));
      for (let px = cx - tw / 2 + 0.6; px < cx + tw / 2; px += 1.1) for (const sz of [-1, 1]) q.push(box(0.5, 0.9, 0.5, px, 0, cz + sz * (td / 2 + 0.5), "darkMetal"));
      q.push(box(Math.min(4, w - 2), 1.8, 0.08, cx, 1.2, z + 0.15, "screen")); plant(q, x + 0.8, z + d - 0.8);
      break;
    }
    case "server": {
      for (let px = x + 1.5; px < x + w - 1; px += 2.4) {
        q.push(box(0.9, 2.2, d - 3, px, 0, cz, "darkMetal"), box(0.05, 1.8, d - 3.4, px + 0.47, 0.2, cz, "blueLight"));
        anims.push({ kind: "leds", x: px + 0.48, z: cz, d: d - 3.4 });
      }
      q.push(pipe([x + 0.5, 2.9, z + 0.6], [x + w - 0.5, 2.9, z + 0.6], 0.18, "gold"));
      break;
    }
    case "lounge": case "kitchen": {
      q.push(box(Math.min(5, w - 2), 0.95, 0.7, x + Math.min(5, w - 2) / 2 + 0.8, 0, z + 0.6, "white"), box(Math.min(5, w - 2), 0.05, 0.7, x + Math.min(5, w - 2) / 2 + 0.8, 0.95, z + 0.6, "darkMetal"));
      sofa(q, cx - 1.5, cz + 1, 0); sofa(q, cx + 1.5, cz + 1, 0); q.push(box(1.6, 0.4, 0.8, cx, 0, cz + 2.4, "wood"));
      inner((px, pz) => { q.push(cyl(0.45, 0.45, 0.06, px, 0.74, pz, "white", 12), cyl(0.05, 0.05, 0.72, px, 0, pz, "darkMetal", 6)); }, 2.8, 2.8, 2, d * 0.62);
      plant(q, x + w - 0.8, z + 0.8); plant(q, x + 0.8, z + d - 0.8); staff.push({ x: x + 2.2, z: z + 1.5, yaw: 0 });
      break;
    }
    case "lobby": {
      q.push(box(5, 1.1, 1.2, cx, 0, z + d * 0.35, "wood"), box(5.2, 0.12, 1.3, cx, 1.1, z + d * 0.35, "white"), box(5, 0.08, 0.05, cx, 0.6, z + d * 0.35 + 0.62, "warmLight"));
      for (let i = 0; i < 4; i++) q.push(box(0.2, 1, 0.8, cx - 3 + i * 2, 0, z + d - 2.2, "metal"), box(0.05, 0.6, 0.6, cx - 3 + i * 2, 1, z + d - 2.2, "blueLight"));
      sofa(q, x + 3, z + 2.5, 0); sofa(q, x + 3, z + 5.5, Math.PI); plant(q, x + 1, z + 1); plant(q, x + w - 1, z + 1); plant(q, x + w - 1, z + d - 1);
      q.push(box(4, 2.2, 0.1, cx, 1.3, z + 0.15, "blueLight")); staff.push({ x: cx, z: z + d * 0.35 - 1.1, yaw: Math.PI });
      break;
    }
    case "reception": case "security-ops": {
      screenWall(q, x, x + w, z + 0.15, kind === "security-ops" ? 3 : 1);
      for (let px = x + 1.6; px < x + w - 1; px += 2.4) { desk(q, px, z + 3, Math.PI); seats.push({ x: px, z: z + 3 + 0.62, yaw: 0 }); }
      if (kind === "security-ops") q.push(box(w - 2, 1.1, 0.3, cx, 0, z + d - 1, "red"));
      break;
    }
    case "control": {
      screenWall(q, x, x + w, z + 0.15, 3);
      for (let row = 0; row < Math.min(4, Math.floor((d - 3) / 3)); row++)
        for (let px = x + 1.6; px < x + w - 1; px += 2.3) { desk(q, px, z + 3 + row * 3, Math.PI); seats.push({ x: px, z: z + 3 + row * 3 + 0.62, yaw: 0 }); }
      break;
    }
    case "owner": {
      q.push(box(3.4, 0.1, 1.4, cx, 0.78, cz - 2, "wood"), box(3, 0.76, 1.2, cx, 0, cz - 2, "wood"), box(0.7, 1.1, 0.7, cx, 0, cz - 0.8, "darkMetal"));
      q.push(box(Math.min(10, w - 4), 3.6, 0.1, cx, 1.2, z + 0.2, "screen"));
      sofa(q, cx - 5, cz + 4, Math.PI / 2); sofa(q, cx + 5, cz + 4, -Math.PI / 2); q.push(box(2, 0.4, 1.2, cx, 0, cz + 4, "wood"));
      for (let px = x + 1; px < x + w; px += 3) q.push(box(2.4, 2.4, 0.5, px + 1, 0, z + d - 0.4, "wood"));
      anims.push({ kind: "globe", x: cx + 6, z: cz - 3 }); plant(q, x + 1, z + 1); plant(q, x + w - 1, z + 1);
      break;
    }
    case "archive": {
      for (let px = x + 1.2; px < x + w - 0.8; px += 2) { q.push(box(0.6, 2.4, d - 3, px, 0, cz, "wood")); for (let k = 0; k < 4; k++) q.push(box(0.5, 0.35, d - 3.2, px, 0.3 + k * 0.55, cz, "white")); }
      break;
    }
    case "observation": {
      q.push(torus(Math.min(w, d) / 2 - 1, 0.08, cx, 1.1, cz, "gold"));
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, R = Math.min(w, d) / 2 - 2.5; q.push(box(2, 0.45, 0.6, cx + Math.cos(a) * R, 0, cz + Math.sin(a) * R, "wood", 0, -a)); }
      q.push(cyl(0.08, 0.1, 1.3, cx + 3, 0, cz, "metal", 6), cyl(0.12, 0.12, 0.9, cx + 3, 1.3, cz, "metal", 8, 0, 1.1)); plant(q, cx, cz);
      break;
    }
    case "lab": {
      for (let px = x + 2; px < x + w - 1.5; px += 4) {
        q.push(box(2.6, 0.9, 1.2, px, 0, cz - 1.5, "white"), box(2.6, 0.06, 1.2, px, 0.9, cz - 1.5, "darkMetal"), cyl(0.12, 0.12, 0.35, px - 0.6, 0.96, cz - 1.5, "metal", 8));
        q.push(cyl(0.6, 0.6, 1.8, px, 0, cz + 2.5, "glassClear", 16), cyl(0.62, 0.62, 0.2, px, 1.8, cz + 2.5, "metal", 16));
        const g = new THREE.IcosahedronGeometry(0.4, 0); g.translate(px, 0.9, cz + 2.5); q.push({ g, m: "plant" });
        seats.push({ x: px, z: cz - 0.7, yaw: 0 });
      }
      screenWall(q, x, x + w, z + 0.15, 1); staff.push({ x: x + w - 2, z: cz + 1, yaw: -Math.PI / 2 });
      break;
    }
    case "robotics": {
      for (let i = 0; i < 2; i++) anims.push({ kind: "arm", x: x + w * (0.3 + i * 0.4), z: cz - 1, color: "yellow" });
      anims.push({ kind: "robot", x: cx, z: cz + d * 0.25 });
      q.push(cyl(1.4, 1.5, 0.3, cx, 0, cz + d * 0.25, "darkMetal", 24), torus(1.45, 0.06, cx, 0.32, cz + d * 0.25, "blueLight"));
      for (let px = x + 1.6; px < x + w - 1; px += 3) { desk(q, px, z + d - 2, 0); seats.push({ x: px, z: z + d - 2 + 0.62, yaw: Math.PI }); }
      staff.push({ x: cx + 2, z: cz, yaw: 0 });
      break;
    }
    case "ai-core": {
      q.push(cyl(3, 3.2, 0.5, cx, 0, cz, "darkMetal", 32), cyl(2.6, 2.6, 3.6, cx, 0.5, cz, "glassClear", 32), cyl(2.8, 2.8, 0.4, cx, 4.1, cz, "gold", 32),
             torus(3.1, 0.08, cx, 0.6, cz, "blueLight"), torus(2.9, 0.08, cx, 4, cz, "blueLight"));
      anims.push({ kind: "brain", x: cx, z: cz });
      for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, R = Math.min(w, d) / 2 - 2; desk(q, cx + Math.cos(a) * R, cz + Math.sin(a) * R, -a + Math.PI / 2); seats.push({ x: cx + Math.cos(a) * (R - 0.62), z: cz + Math.sin(a) * (R - 0.62), yaw: -a - Math.PI / 2 }); }
      break;
    }
    case "assembly": {
      const L = w - 4;
      q.push(box(L, 0.9, 1.6, cx, 0, cz, "darkMetal"), box(L, 0.08, 1.4, cx, 0.9, cz, "metal"));
      for (let k = 0; k < Math.floor(L / 6); k++) anims.push({ kind: "arm", x: x + 4 + k * 6, z: cz - 1.8, color: "yellow" });
      anims.push({ kind: "conveyor", x: cx, z: cz, w: L });
      q.push(box(w - 2, 0.6, 0.6, cx, 3.6, z + 1.5, "yellow"), box(0.5, 3.6, 0.5, x + 1, 0, z + 1.5, "yellow"), box(0.5, 3.6, 0.5, x + w - 1, 0, z + 1.5, "yellow"));
      for (let px = x + 1.5; px < x + w; px += 5) q.push(box(0.15, 0.02, d - 2, px, 0.32, cz, "yellow"));
      staff.push({ x: cx - 3, z: cz + 2, yaw: Math.PI }, { x: cx + 5, z: cz + 2.2, yaw: Math.PI });
      break;
    }
    case "storage": {
      for (let px = x + 1.5; px < x + w - 1; px += 4.5) {
        for (const pz of [z + d * 0.3, z + d * 0.7]) {
          q.push(box(0.12, 3.4, 0.12, px - 1.6, 0, pz, "red"), box(0.12, 3.4, 0.12, px + 1.6, 0, pz, "red"));
          for (let k = 0; k < 3; k++) { q.push(box(3.3, 0.08, 1.1, px, 0.4 + k * 1.1, pz, "yellow")); if (r() > 0.25) q.push(box(1.4, 0.7, 0.9, px - 0.8 + r() * 1.6, 0.48 + k * 1.1, pz, "wood")); }
        }
      }
      anims.push({ kind: "forklift", x: cx, z: z + d * 0.5, w: w - 4 });
      staff.push({ x: x + 2, z: z + 2, yaw: 0 });
      break;
    }
    case "machines": {
      for (let px = x + 2.5; px < x + w - 2; px += 5) {
        q.push(cyl(0.9, 0.9, 1.8, px, 0, cz - 2, "pipe", 16, 0, Math.PI / 2), box(1.6, 1.4, 1.2, px, 0, cz + 1.5, "darkMetal"), box(1.2, 1.8, 0.4, px, 0, z + d - 0.4, "metal"));
        q.push(pipe([px, 1.8, cz - 2], [px, 3.4, cz - 2], 0.2, "gold"));
      }
      q.push(pipe([x + 1, 3.4, cz - 2], [x + w - 1, 3.4, cz - 2], 0.22, "gold"), pipe([x + 1, 3.0, cz - 1.4], [x + w - 1, 3.0, cz - 1.4], 0.18, "pipe"));
      staff.push({ x: cx, z: cz, yaw: 0 });
      break;
    }
  }
  return { parts: [...p, ...lift(q)], seats: seats.map((s) => ({ ...s })), anims, staff };
}
