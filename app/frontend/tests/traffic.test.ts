// Run: node --experimental-strip-types tests/traffic.test.ts
import { buildLanes, spawnVehicles, stepVehicles, vehiclePos, buildPedGraph, spawnPeds, stepPeds, pedPos, green, onCarriageway } from "../src/world/traffic.ts";
import { cells, ROAD_W, AVENUES, STREETS } from "../src/world/plan.ts";
let s = 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
const lanes = buildLanes(), vs = spawnVehicles(lanes, 6, rnd), g = buildPedGraph(), ps = spawnPeds(g, 400, rnd);
const plots = cells();
let overlap = 0, redRun = 0, hit = 0, inPlot = 0, onRoad = 0, crossings = 0, moved = 0, steps = 0;
const prev = vs.map((v) => v.s);
const dt = 1 / 30;
for (let t = 0; t < 600; t += dt, steps++) {
  stepVehicles(lanes, vs, t, dt); stepPeds(g, ps, t, dt, rnd);
  // 1. no overlap inside a lane
  const by = new Map<number, typeof vs>(); vs.forEach((v) => { if (!by.has(v.lane)) by.set(v.lane, []); by.get(v.lane)!.push(v); });
  by.forEach((l) => { l.sort((a, b) => a.s - b.s); for (let i = 1; i < l.length; i++) if (l[i].s - l[i].len / 2 < l[i - 1].s + l[i - 1].len / 2) overlap++; });
  // 2. no vehicle crosses a stop line while its light is red (unless it was already within 1 m = committed)
  vs.forEach((v, i) => {
    const L = lanes[v.lane];
    for (const st of L.stops) {
      const fPrev = prev[i] + v.len / 2, fNow = v.s + v.len / 2;
      if (fPrev < st - 1.0 && fNow >= st && !green(L.axis, t)) redRun++;
    }
    if (v.s !== prev[i]) moved++;
    prev[i] = v.s;
  });
  // 3. pedestrians: never in a building plot; on the carriageway only while on a crosswalk; never hit by a vehicle
  const cars = vs.map((v) => { const [x, z] = vehiclePos(lanes[v.lane], v.s); return { x, z, v, ax: lanes[v.lane].axis }; });
  for (const p of ps) {
    const [x, z] = pedPos(g, p), e = g.edges[p.edge];
    if (plots.some((c) => x > c.x0 + 0.2 && x < c.x1 - 0.2 && z > c.z0 + 0.2 && z < c.z1 - 0.2)) inPlot++;
    if (onCarriageway(x, z) && !e.cross) onRoad++;
    if (e.cross && p.u > 0) {
      if (steps % 30 === 0) crossings++;
      for (const c of cars) {
        const halfL = c.v.len / 2 + 0.6, halfW = 1.3;
        const dx = Math.abs(c.x - x), dz = Math.abs(c.z - z);
        if ((c.ax === "z" ? dz < halfL && dx < halfW : dx < halfL && dz < halfW)) hit++;
      }
    }
  }
}
const ok = overlap === 0 && redRun === 0 && hit === 0 && inPlot === 0 && onRoad === 0 && crossings > 0 && moved > 0;
console.log(JSON.stringify({ lanes: lanes.length, vehicles: vs.length, pedestrians: ps.length, graphNodes: g.nodes.length, graphEdges: g.edges.length,
  simulatedSeconds: 600, overlap, redRun, pedHitByVehicle: hit, pedInsideBuildingPlot: inPlot, pedOnRoadOutsideCrosswalk: onRoad, crossingSamples: crossings, vehicleMoves: moved }));
if (!ok) { console.error("TRAFFIC TEST FAILED"); process.exit(1); } else console.log("TRAFFIC TEST PASSED");
