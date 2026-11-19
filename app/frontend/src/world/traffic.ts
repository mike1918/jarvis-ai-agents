/**
 * Road and pedestrian simulation (pure logic, no Three.js — unit-testable).
 * Vehicles: right-hand traffic on lanes, car-following with a safe gap, stop lines before signalised crossings.
 * Pedestrians: navigation graph on sidewalks around blocks + crosswalks; they cross only when the crossed road's
 * traffic is red long enough to finish, so they never walk through cars, and never enter building plots.
 */
import { AVENUES, ROAD_W, SIDEWALK, STREETS, WORLD, COAST_X, cells } from "./plan.ts";

export const CYCLE = 30;
/** Signal phase: avenues (traffic moving along z) green 0–12 s, all-red 12–15, streets (along x) green 15–27, all-red 27–30. */
export function green(axis: "z" | "x", t: number): boolean {
  const p = ((t % CYCLE) + CYCLE) % CYCLE;
  return axis === "z" ? p < 12 : p >= 15 && p < 27;
}
/** Seconds of green left for `axis` (0 if not green). */
export function greenLeft(axis: "z" | "x", t: number): number {
  if (!green(axis, t)) return 0;
  const p = ((t % CYCLE) + CYCLE) % CYCLE; return (axis === "z" ? 12 : 27) - p;
}
/** Seconds until traffic on `axis` gets green again (0 if green now). */
export function untilGreen(axis: "z" | "x", t: number): number {
  const p = ((t % CYCLE) + CYCLE) % CYCLE;
  if (green(axis, t)) return 0;
  const start = axis === "z" ? 0 : 15;
  return (start - p + CYCLE) % CYCLE;
}

export interface Vehicle { lane: number; s: number; v: number; vmax: number; len: number; kind: "car" | "bus" | "truck"; pass?: number }
export interface Lane { axis: "z" | "x"; line: number; dir: 1 | -1; start: number; end: number; stops: number[] }

const LANE_OFF = 2.2;
const STOP_OFF = ROAD_W / 2 + 3.5;          // stop line: behind the crosswalk band
const AV_Z0 = WORLD.minZ + 30, AV_Z1 = WORLD.maxZ - 5, ST_X0 = COAST_X + 16, ST_X1 = WORLD.maxX - 5;

export function buildLanes(): Lane[] {
  const lanes: Lane[] = [];
  for (const X of AVENUES) for (const dir of [1, -1] as const) {
    // s = dir * z ; stop lines before each street crossing
    const stops = STREETS.filter((Z) => Z > AV_Z0 && Z < AV_Z1).map((Z) => dir * Z - STOP_OFF).sort((a, b) => a - b);
    lanes.push({ axis: "z", line: X - dir * LANE_OFF, dir, start: dir > 0 ? AV_Z0 : -AV_Z1, end: dir > 0 ? AV_Z1 : -AV_Z0, stops });
  }
  for (const Z of STREETS) for (const dir of [1, -1] as const) {
    const stops = AVENUES.filter((X) => X > ST_X0 && X < ST_X1).map((X) => dir * X - STOP_OFF).sort((a, b) => a - b);
    lanes.push({ axis: "x", line: Z + dir * LANE_OFF, dir, start: dir > 0 ? ST_X0 : -ST_X1, end: dir > 0 ? ST_X1 : -ST_X0, stops });
  }
  return lanes;
}

export function vehiclePos(l: Lane, s: number): [number, number, number] {
  const c = l.dir * s; // world coordinate along the axis
  return l.axis === "z" ? [l.line, c, l.dir > 0 ? 0 : Math.PI] : [c, l.line, l.dir > 0 ? Math.PI / 2 : -Math.PI / 2];
}

export function spawnVehicles(lanes: Lane[], perLane: number, rnd: () => number): Vehicle[] {
  const out: Vehicle[] = [];
  lanes.forEach((l, li) => {
    const L = l.end - l.start;
    for (let k = 0; k < perLane; k++) {
      const r = rnd(), kind = r < 0.08 ? "bus" : r < 0.22 ? "truck" : "car";
      const len = kind === "bus" ? 11 : kind === "truck" ? 8 : 4.4;
      out.push({ lane: li, s: l.start + ((k + rnd() * 0.5) / perLane) * L, v: 0, vmax: kind === "car" ? 11 + rnd() * 3 : 8.5, len, kind });
    }
  });
  return out;
}

/** Advance all vehicles by dt at signal time t. Guarantees: no overlap inside a lane, no entering a crossing on red. */
export function stepVehicles(lanes: Lane[], vs: Vehicle[], t: number, dt: number) {
  const byLane = new Map<number, Vehicle[]>();
  for (const v of vs) { if (!byLane.has(v.lane)) byLane.set(v.lane, []); byLane.get(v.lane)!.push(v); }
  byLane.forEach((list, li) => {
    const l = lanes[li], go = green(l.axis, t);
    list.sort((a, b) => b.s - a.s);                    // leader first
    for (let i = 0; i < list.length; i++) {
      const v = list[i];
      v.v = Math.min(v.vmax, v.v + 4 * dt);
      let target = v.s + v.v * dt;
      const front = v.s + v.len / 2;
      const stop = l.stops.find((x) => x >= front - 0.01);
      const lead = i > 0 ? list[i - 1] : null;
      if (v.pass !== undefined && front > v.pass + 2 * STOP_OFF + v.len) v.pass = undefined;   // crossing cleared
      if (stop !== undefined && v.pass !== stop) {
        // entry permission: only on green and only with room behind the leader beyond the crossing ("don't block the box")
        const noRoom = lead !== null && lead.s - lead.len / 2 - (stop + 2 * STOP_OFF) < v.len + 2.5;
        // must be able to clear the crossing (zone + own length) before the all-red clearance ends
        const canClear = greenLeft(l.axis, t) + 3 >= (2 * STOP_OFF + v.len + 1) / Math.max(v.v, 2.5);
        if (go && !noRoom && canClear && stop - front < 1.0) v.pass = stop;
        else if (!go || noRoom) target = Math.min(target, stop - v.len / 2);
      }
      if (lead) target = Math.min(target, lead.s - lead.len / 2 - v.len / 2 - 2.5);
      if (target < v.s) target = v.s;                  // never reverse
      v.v = Math.min(v.v, (target - v.s) / Math.max(dt, 1e-6));
      v.s = target;
    }
    // wrap around (respawn at the lane start only when the entry is free)
    for (const v of list) {
      if (v.s - v.len / 2 > l.end) {
        const minS = Math.min(...list.filter((o) => o !== v).map((o) => o.s - o.len / 2));
        if (!isFinite(minS) || minS > l.start + v.len + 3) { v.s = l.start; v.v = 0; }
      }
    }
  });
}

/* ------------------------------ pedestrians ------------------------------ */
export interface PNode { x: number; z: number; edges: number[] }
export interface PEdge { a: number; b: number; len: number; cross?: { axis: "z" | "x" } }   // cross.axis = axis of the road's traffic
export interface Graph { nodes: PNode[]; edges: PEdge[] }

const WALK = 1.4;                                      // m/s
const IN = 1.5;                                        // walk line inside the sidewalk band

export function buildPedGraph(): Graph {
  const cs = cells(), nodes: PNode[] = [], edges: PEdge[] = [];
  const key = new Map<string, number>();
  const node = (x: number, z: number) => {
    const k = `${x.toFixed(2)},${z.toFixed(2)}`;
    if (!key.has(k)) { key.set(k, nodes.length); nodes.push({ x, z, edges: [] }); }
    return key.get(k)!;
  };
  const edge = (a: number, b: number, cross?: PEdge["cross"]) => {
    const len = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z);
    const id = edges.length; edges.push({ a, b, len, cross }); nodes[a].edges.push(id); nodes[b].edges.push(id);
  };
  const corner: Record<string, [number, number, number, number]> = {};
  for (const c of cs) {
    const x0 = c.x0 - IN, x1 = c.x1 + IN, z0 = c.z0 - IN, z1 = c.z1 + IN;
    const n = [node(x0, z0), node(x1, z0), node(x1, z1), node(x0, z1)] as [number, number, number, number];
    corner[`${c.i},${c.j}`] = n;
    edge(n[0], n[1]); edge(n[1], n[2]); edge(n[2], n[3]); edge(n[3], n[0]);
  }
  for (const c of cs) {
    const me = corner[`${c.i},${c.j}`], east = corner[`${c.i + 1},${c.j}`], south = corner[`${c.i},${c.j + 1}`];
    // crosswalks exist only at signalised intersections (a corner next to a crossing road)
    const nearStreet = (z: number) => STREETS.some((Z) => Math.abs(Math.abs(z - Z) - (ROAD_W / 2 + SIDEWALK - IN)) < 0.5);
    const nearAvenue = (x: number) => AVENUES.some((X) => Math.abs(Math.abs(x - X) - (ROAD_W / 2 + SIDEWALK - IN)) < 0.5);
    if (east) for (const [a, b] of [[me[1], east[0]], [me[2], east[3]]]) if (nearStreet(nodes[a].z)) edge(a, b, { axis: "z" });   // across an avenue
    if (south) for (const [a, b] of [[me[3], south[0]], [me[2], south[1]]]) if (nearAvenue(nodes[a].x)) edge(a, b, { axis: "x" }); // across a street
  }
  return { nodes, edges };
}

export interface Ped { edge: number; from: number; u: number; waiting: boolean; off: number; speed: number }

export function spawnPeds(g: Graph, n: number, rnd: () => number): Ped[] {
  const walkable = g.edges.map((e, i) => (e.cross ? -1 : i)).filter((i) => i >= 0);
  return Array.from({ length: n }, () => {
    const e = walkable[Math.floor(rnd() * walkable.length)];
    return { edge: e, from: g.edges[e].a, u: rnd(), waiting: false, off: (rnd() - 0.5) * 1.4, speed: WALK * (0.8 + rnd() * 0.4) };
  });
}

/** Seconds since traffic on `axis` turned red (Infinity while green). */
export function sinceRed(axis: "z" | "x", t: number): number {
  if (green(axis, t)) return Infinity;
  const p = ((t % CYCLE) + CYCLE) % CYCLE, redAt = axis === "z" ? 12 : 27;
  return (p - redAt + CYCLE) % CYCLE;
}
/** May a pedestrian start crossing a road whose traffic moves along `axis`? Only after the all-red clearance
 *  and only if the walk can be finished (at this pedestrian's speed) before that traffic gets green again. */
export function mayCross(axis: "z" | "x", t: number, len: number, speed = WALK): boolean {
  return !green(axis, t) && sinceRed(axis, t) >= 3.5 && untilGreen(axis, t) >= len / speed + 1.0;
}

export function stepPeds(g: Graph, ps: Ped[], t: number, dt: number, rnd: () => number) {
  for (const p of ps) {
    const e = g.edges[p.edge];
    if (e.cross && p.u === 0 && !mayCross(e.cross.axis, t, e.len, p.speed)) { p.waiting = true; continue; }
    p.waiting = false;
    p.u += (p.speed * dt) / e.len;
    if (p.u >= 1) {
      const at = p.from === e.a ? e.b : e.a;
      const opts = g.nodes[at].edges.filter((x) => x !== p.edge);
      const next = opts.length ? opts[Math.floor(rnd() * opts.length)] : p.edge;
      p.edge = next; p.from = at; p.u = 0;
    }
  }
}

export function pedPos(g: Graph, p: Ped): [number, number, number] {
  const e = g.edges[p.edge], A = g.nodes[p.from], B = g.nodes[p.from === e.a ? e.b : e.a];
  const dx = B.x - A.x, dz = B.z - A.z, L = Math.hypot(dx, dz) || 1;
  const ox = (-dz / L) * p.off, oz = (dx / L) * p.off;
  return [A.x + dx * p.u + ox, A.z + dz * p.u + oz, Math.atan2(dx, dz)];
}

/** Is a world point on a carriageway (road surface, not sidewalk)? Used by tests. */
export function onCarriageway(x: number, z: number) {
  return AVENUES.some((X) => Math.abs(x - X) < ROAD_W / 2) || STREETS.some((Z) => Math.abs(z - Z) < ROAD_W / 2);
}
export const SIDEWALK_W = SIDEWALK;
