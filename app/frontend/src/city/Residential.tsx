import { useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { AVENUES, COAST_X, BEACH_W, LAND, PORT, ROAD_W, STREETS, materials, rng } from "./env";

/** Grid cells of the city (between roads). */
export function cells() {
  const xs = [COAST_X + BEACH_W, ...AVENUES, LAND.maxX];
  const zs = [PORT.maxZ + 14, ...STREETS, LAND.maxZ];
  const out: { cx: number; cz: number; w: number; d: number; ix: number; iz: number }[] = [];
  for (let i = 0; i < xs.length - 1; i++)
    for (let j = 0; j < zs.length - 1; j++) {
      const x0 = xs[i] + (i ? ROAD_W / 2 : 0) + 2, x1 = xs[i + 1] - ROAD_W / 2 - 2;
      const z0 = zs[j] + (j ? ROAD_W / 2 : 0) + 2, z1 = zs[j + 1] - ROAD_W / 2 - 2;
      if (x1 - x0 < 12 || z1 - z0 < 12) continue;
      out.push({ cx: (x0 + x1) / 2, cz: (z0 + z1) / 2, w: x1 - x0, d: z1 - z0, ix: i, iz: j });
    }
  return out;
}

/** Cells occupied by the technology park (district buildings + JARVIS tower). */
export const TECH_CELLS: [number, number][] = [
  [45, 25], [-5, -25], [45, -25], [95, -25], [-5, 25], [95, 25], [-5, 75], [45, 75], [95, 75], [145, 25], [45, 125],
];
export const isTechCell = (cx: number, cz: number) => TECH_CELLS.some(([x, z]) => Math.abs(x - cx) < 6 && Math.abs(z - cz) < 6);

const TINTS = ["#ffffff", "#f6f1e7", "#efe6d6", "#e9e4dc", "#f3ead8", "#dcd6cc"];
const CELL_W = 3.5 * 8, CELL_H = 3.2 * 8; // texture repeat: 8 window cells

function building(w: number, h: number, d: number, x: number, z: number, tint: THREE.Color, uOff: number, vOff: number) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  const widths = [d, d, 0, 0, w, w]; // +x -x +y -y +z -z
  for (let f = 0; f < 6; f++)
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      if (f === 2 || f === 3) { uv.setXY(i, 0.003, 0.003); continue; }
      uv.setXY(i, uv.getX(i) * (widths[f] / CELL_W) + uOff, uv.getY(i) * (h / CELL_H) + vOff);
    }
  g.translate(x, h / 2, z);
  const col = new Float32Array(g.attributes.position.count * 3);
  for (let i = 0; i < col.length; i += 3) col.set([tint.r, tint.g, tint.b], i);
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

/** Ashdod-style residential quarters ("Rova"): white and cream towers by the sea, mid-rise blocks inland, solar water heaters on roofs. */
export function Residential() {
  const { body, roofs } = useMemo(() => {
    const r = rng(2024), parts: THREE.BufferGeometry[] = [], roofParts: THREE.BufferGeometry[] = [];
    const tint = new THREE.Color();
    for (const c of cells()) {
      if (isTechCell(c.cx, c.cz)) continue;
      const coastal = c.cx < -20, nx = c.w > 30 ? 2 : 1, nz = c.d > 30 ? 2 : 1;
      if (r() < 0.12) continue; // small parks
      for (let a = 0; a < nx; a++)
        for (let b = 0; b < nz; b++) {
          const lw = c.w / nx, ld = c.d / nz;
          const w = Math.min(lw - 4, 9 + r() * 8), d = Math.min(ld - 4, 9 + r() * 8);
          const h = coastal ? 28 + r() * 46 : c.cx > 160 ? 9 + r() * 12 : 14 + r() * 24;
          const x = c.cx - c.w / 2 + lw * (a + 0.5), z = c.cz - c.d / 2 + ld * (b + 0.5);
          tint.set(TINTS[Math.floor(r() * TINTS.length)]);
          parts.push(building(w, h, d, x, z, tint, Math.floor(r() * 8) / 8, Math.floor(r() * 8) / 8));
          for (let k = 0; k < 2 + Math.floor(r() * 3); k++) {
            const p = new THREE.BoxGeometry(1.6, 0.15, 1.1);
            p.rotateX(-0.5); p.translate(x - w / 2 + 2 + r() * (w - 4), h + 0.6, z - d / 2 + 2 + r() * (d - 4));
            roofParts.push(p);
          }
        }
    }
    return { body: mergeGeometries(parts), roofs: mergeGeometries(roofParts) };
  }, []);
  return (
    <group>
      <mesh geometry={body} material={materials().facade} castShadow receiveShadow />
      <mesh geometry={roofs} castShadow><meshStandardMaterial color="#1e3a5f" metalness={0.5} roughness={0.35} /></mesh>
    </group>
  );
}
