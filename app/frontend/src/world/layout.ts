import { FLOOR_H, type BuildingSpec, type FloorSpec, type RoomSpec } from "./plan.ts";
import { box, mergeParts, type Part } from "./kit.ts";
import { furnish, type Seat } from "./furniture.ts";

/** Workplace layout of a building (pure, no React): rooms fitted to the footprint, furniture, one desk per agent. */
export const floorH = (b: BuildingSpec) => (b.kind === "tower" ? 5.2 : FLOOR_H);
const AGENT_ROOMS = new Set(["office", "control", "lab", "robotics", "ai-core", "reception", "security-ops"]);

/** Fit a floor's rooms into the building footprint (templates are authored in approximate local units). */
export function fitRooms(f: FloorSpec, w: number, d: number): RoomSpec[] {
  const x0 = Math.min(...f.rooms.map((r) => r.x)), x1 = Math.max(...f.rooms.map((r) => r.x + r.w));
  const z0 = Math.min(...f.rooms.map((r) => r.z)), z1 = Math.max(...f.rooms.map((r) => r.z + r.d));
  const sx = (w - 1) / (x1 - x0), sz = (d - 1) / (z1 - z0);
  return f.rooms.map((r) => ({ ...r, x: -w / 2 + 0.5 + (r.x - x0) * sx, z: -d / 2 + 0.5 + (r.z - z0) * sz, w: r.w * sx, d: r.d * sz }));
}

export interface Layout {
  floors: { rooms: RoomSpec[]; merged: ReturnType<typeof mergeParts>; anims: ReturnType<typeof furnish>["anims"]; staff: Seat[] }[];
  seats: { agent: string; floor: number; room: string; seat: Seat; door: [number, number] }[];
}

/** Workplace layout for a building: furniture per room and a desk per library agent working here (by agent id). */
export function buildLayout(b: BuildingSpec, agents: string[]): Layout {
  const w = b.kind === "tower" ? 28 : b.w, d = b.kind === "tower" ? 28 : b.d;
  const floors: Layout["floors"] = [];
  const free: { floor: number; room: string; seat: Seat; door: [number, number] }[][] = [];
  (b.interior ?? []).forEach((f, fi) => {
    const rooms = fitRooms(f, w, d), parts: Part[] = [];
    const anims: Layout["floors"][number]["anims"] = [], staff: Seat[] = [];
    parts.push(box(w, 0.3, d, 0, 0, 0, "white"));                                                        // slab
    parts.push(box(w, floorH(b) - 0.3, 0.3, 0, 0.3, -d / 2 + 0.15, b.kind === "factory" ? "brick" : "concrete", FLOOR_H));   // back wall
    parts.push(box(0.3, floorH(b) - 0.3, d, -w / 2 + 0.15, 0.3, 0, b.kind === "factory" ? "brick" : "concrete", FLOOR_H));    // left wall
    parts.push(box(w, 1, 0.08, 0, 0.3, d / 2 - 0.05, "glassClear"), box(0.08, 1, d, w / 2 - 0.05, 0.3, 0, "glassClear"));   // cut-edge railings
    for (const r of rooms) {
      const f2 = furnish(r, fi * 100 + r.id.length * 7 + Math.round(r.x));
      parts.push(...f2.parts); anims.push(...f2.anims); staff.push(...f2.staff);
      if (r.x + r.w < w / 2 - 0.6) parts.push(box(0.08, 2.8, r.d, r.x + r.w, 0.3, r.z + r.d / 2, "glassClear"));   // partitions
      if (r.z + r.d < d / 2 - 0.6) parts.push(box(r.w, 2.8, 0.08, r.x + r.w / 2, 0.3, r.z + r.d, "glassClear"));
      parts.push(box(r.w * 0.6, 0.06, 0.25, r.x + r.w / 2, floorH(b) - 0.2, r.z + r.d / 2, "warmLight"));          // ceiling light
      if (AGENT_ROOMS.has(r.kind)) free.push(f2.seats.map((s) => ({ floor: fi, room: r.id, seat: s, door: [r.x + r.w - 0.8, r.z + r.d - 0.6] as [number, number] })));
    }
    floors.push({ rooms, merged: mergeParts(parts), anims, staff });
  });
  // round-robin agents over agent rooms so every working floor is staffed; the coordinator sits in the command centre first
  const seats: Layout["seats"] = [];
  const order = [...agents].sort((a, b) => (a === "jarvis" ? -1 : b === "jarvis" ? 1 : a.localeCompare(b)));
  const cmd = b.kind === "tower" ? free.findIndex((list) => list[0]?.room === "t-cmd") : -1;
  order.forEach((name, i) => {
    const pools = free.filter((l) => l.length);
    if (!pools.length) return;
    const pool = name === "jarvis" && cmd >= 0 && free[cmd].length ? free[cmd] : pools[i % pools.length];
    const s = pool.shift()!; seats.push({ agent: name, ...s });
  });
  return { floors, seats };
}

