// Run: node --experimental-strip-types tests/seats.test.ts — every active library agent must get its own desk in its building.
import { readFileSync } from "node:fs";
import { BUILDINGS } from "../src/world/plan.ts";
import { buildLayout } from "../src/world/layout.ts";
const reg = JSON.parse(readFileSync(new URL("../../../.claude/jarvis/registry.json", import.meta.url), "utf8"));
const active = reg.agents.filter((a: any) => !a.disabled);
const byFolder: Record<string, string[]> = {};
for (const a of active) (byFolder[a.folder] ??= []).push(a.name);
let seated = 0, missing: string[] = [], dupSeats = 0;
const covered = new Set<string>();
for (const b of BUILDINGS) {
  const agents = (b.folders ?? []).flatMap((f) => byFolder[f] ?? []);
  b.folders?.forEach((f) => covered.add(f));
  const L = buildLayout(b, agents);
  const got = new Set(L.seats.map((s) => s.agent));
  agents.filter((a) => !got.has(a)).forEach((a) => missing.push(`${b.id}:${a}`));
  const keys = L.seats.map((s) => `${s.floor}|${s.seat.x.toFixed(2)}|${s.seat.z.toFixed(2)}`);
  dupSeats += keys.length - new Set(keys).size;
  seated += got.size;
  console.log(`${b.id.padEnd(14)} agents ${String(agents.length).padStart(3)}  seated ${String(got.size).padStart(3)}`);
}
const homeless = Object.keys(byFolder).filter((f) => !covered.has(f));
console.log(JSON.stringify({ active: active.length, seated, missing: missing.length, dupSeats, foldersWithoutBuilding: homeless }));
if (missing.length || dupSeats || homeless.length || seated !== active.length) { console.error("SEATS TEST FAILED", missing.slice(0, 10)); process.exit(1); }
console.log("SEATS TEST PASSED");
