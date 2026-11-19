import * as THREE from "three";
import { FLOOR_H, type Kind } from "./plan";
import { box, cyl, pipe, rng, sphere, torus, type Part } from "./kit";

/** All builders produce parts in local coordinates: centred on (0,0), ground at y = 0. */

function hvac(parts: Part[], w: number, d: number, y: number, r: () => number, n = 4) {
  for (let i = 0; i < n; i++) {
    const x = (r() - 0.5) * (w - 6), z = (r() - 0.5) * (d - 6), s = 2 + r() * 2.5;
    parts.push(box(s, 1.6, s * 0.8, x, y, z, "metal"));
    parts.push(cyl(s * 0.3, s * 0.3, 0.3, x, y + 1.6, z, "darkMetal", 10));
  }
  parts.push(box(3, 2.4, 3, (r() - 0.5) * (w - 8), y, (r() - 0.5) * (d - 8), "darkMetal")); // stair/lift housing
}
function parapet(parts: Part[], w: number, d: number, y: number, m: "darkMetal" | "gold" | "concrete" = "darkMetal") {
  parts.push(box(w + 0.6, 0.9, 0.5, 0, y, d / 2, m), box(w + 0.6, 0.9, 0.5, 0, y, -d / 2, m),
             box(0.5, 0.9, d, w / 2, y, 0, m), box(0.5, 0.9, d, -w / 2, y, 0, m));
}
function entrance(parts: Part[], w: number, d: number) {
  parts.push(box(Math.min(12, w * 0.4), 0.5, 4, 0, 4.2, d / 2 + 2, "darkMetal"));
  parts.push(box(Math.min(11, w * 0.38), 0.1, 3.6, 0, 4.15, d / 2 + 2, "warmLight"));
  parts.push(box(Math.min(8, w * 0.3), 3.6, 0.3, 0, 0, d / 2 + 0.2, "glassClear"));
}

export function building(kind: Kind, w: number, d: number, floors: number, seed = 1): Part[] {
  const r = rng(seed), h = floors * FLOOR_H, parts: Part[] = [];
  switch (kind) {
    case "office": {
      parts.push(box(w, h, d, 0, 0, 0, "concrete", FLOOR_H));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        parts.push(box(1.2, h + 1, 1.2, sx * (w / 2 - 0.3), 0, sz * (d / 2 - 0.3), "gold"));
        parts.push(box(0.25, h - 2, 0.25, sx * (w / 2 + 0.35), 1, sz * (d / 2 - 2), "blueLight"));
      }
      for (let f = 1; f < floors; f++) parts.push(box(w + 0.4, 0.35, d + 0.4, 0, f * FLOOR_H - 0.2, 0, "darkMetal"));
      parts.push(box(w * 0.3, h + 3, d * 0.3, w * 0.25, 0, 0, "darkMetal"));
      parapet(parts, w, d, h); hvac(parts, w, d, h, r, 5); entrance(parts, w, d);
      break;
    }
    case "glass-office": {
      parts.push(box(w, h, d, 0, 0, 0, "glass", FLOOR_H));
      parts.push(box(w * 0.22, h + 2, d + 0.6, -w * 0.39, 0, 0, "concrete", FLOOR_H));
      for (let f = 1; f <= floors; f++) parts.push(box(w + 0.5, 0.3, d + 0.5, 0, f * FLOOR_H - 0.3, 0, "gold"));
      parts.push(box(w * 0.7, 0.5, 0.3, w * 0.1, h + 0.2, d / 2 + 0.2, "blueLight"));
      parts.push(box(w * 0.5, 2.5, d * 0.5, w * 0.1, h, 0, "darkMetal"));
      parapet(parts, w, d, h, "gold"); hvac(parts, w * 0.6, d * 0.6, h + 2.5, r, 3); entrance(parts, w, d);
      break;
    }
    case "lab": {
      const R = Math.min(w, d) / 2;
      parts.push(cyl(R, R, FLOOR_H * 2, 0, 0, 0, "lab", 40));
      parts.push(cyl(R + 0.4, R + 0.4, 0.5, 0, FLOOR_H * 2, 0, "gold", 40));
      parts.push(sphere(R * 0.8, 0, FLOOR_H * 2 + 0.3, 0, "glassClear", true));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI;
        const rib = new THREE.TorusGeometry(R * 0.8, 0.18, 6, 32, Math.PI);
        rib.rotateY(a); rib.translate(0, FLOOR_H * 2 + 0.3, 0); parts.push({ g: rib, m: "gold" });
      }
      parts.push(torus(R * 0.82, 0.25, 0, FLOOR_H * 2 + 0.5, 0, "blueLight"));
      parts.push(sphere(R * 0.18, 0, FLOOR_H * 2 + 2.5, 0, "blueLight"));                      // glowing AI core visible through the dome
      parts.push(box(w * 0.35, FLOOR_H * 3, d * 0.3, R + w * 0.05, 0, -d * 0.25, "lab", FLOOR_H)); // side wing
      parts.push(cyl(0.3, 0.4, 7, R + w * 0.05, FLOOR_H * 3, -d * 0.25, "metal", 8));
      const dish = new THREE.SphereGeometry(3.4, 16, 8, 0, Math.PI * 2, 0, Math.PI / 3.2); dish.rotateX(-0.9);
      dish.translate(R + w * 0.05, FLOOR_H * 3 + 7, -d * 0.25); parts.push({ g: dish, m: "white" });
      entrance(parts, w, d);
      break;
    }
    case "datacenter": {
      parts.push(box(w, h, d, 0, 0, 0, "darkMetal"));
      for (let x = -w / 2 + 3; x < w / 2 - 1; x += 3.2) parts.push(box(0.5, h - 3, 0.3, x, 1.5, d / 2 + 0.15, "blueLight"));
      for (let x = -w / 2 + 3; x < w / 2 - 1; x += 3.2) parts.push(box(0.5, h - 3, 0.3, x, 1.5, -d / 2 - 0.15, "blueLight"));
      parts.push(box(w + 1, 0.6, d + 1, 0, h, 0, "metal"));
      for (let i = 0; i < 6; i++) {
        const x = -w / 2 + 5 + i * ((w - 10) / 5);
        parts.push(box(4, 2.2, 4, x, h + 0.6, -d / 4, "metal"), cyl(1.6, 1.6, 0.4, x, h + 2.8, -d / 4, "darkMetal", 14));
      }
      const dish = new THREE.SphereGeometry(4.2, 18, 8, 0, Math.PI * 2, 0, Math.PI / 3); dish.rotateX(-1.0); dish.translate(w / 4, h + 7, d / 4);
      parts.push({ g: dish, m: "white" }, cyl(0.4, 0.6, 6, w / 4, h + 0.6, d / 4, "metal", 8));
      entrance(parts, w, d);
      break;
    }
    case "security": {
      parts.push(box(w, h, d, 0, 0, 0, "concrete", FLOOR_H));
      parts.push(box(w + 0.6, 1.2, d + 0.6, 0, h, 0, "darkMetal"));
      for (const sx of [-1, 1]) parts.push(box(0.4, h, 0.4, sx * (w / 2 + 0.25), 0, d / 2 + 0.25, "red"));
      parts.push(cyl(0.3, 0.3, 12, -w / 3, h + 1.2, -d / 4, "metal", 6), sphere(0.6, -w / 3, h + 13.4, -d / 4, "red"));
      parts.push(box(w * 0.5, 0.4, 0.3, 0, h - 1, d / 2 + 0.2, "blueLight"));
      hvac(parts, w, d, h + 1.2, r, 3); entrance(parts, w, d);
      break;
    }
    case "factory": case "workshop": {
      const lower = FLOOR_H * 1.6;
      parts.push(box(w, lower, d, 0, 0, 0, "brick", FLOOR_H));
      parts.push(box(w, h - lower, d, 0, lower, 0, "corrugated"));
      const teeth = Math.max(3, Math.floor(w / 9));                                        // sawtooth roof
      for (let i = 0; i < teeth; i++) {
        const tx = -w / 2 + (i + 0.5) * (w / teeth), tw = w / teeth;
        const g = new THREE.CylinderGeometry(tw * 0.62, tw * 0.62, d, 3, 1); g.rotateX(Math.PI / 2); g.rotateZ(Math.PI / 6);
        g.scale(1, 0.55, 1); g.translate(tx, h + 1.2, 0); parts.push({ g, m: "roof" });
        parts.push(box(0.3, 2.2, d - 1, tx + tw * 0.35, h, 0, "glassClear"));
      }
      parts.push(box(6, 5, 0.4, w / 2 - 6, 0, d / 2 + 0.2, "darkMetal"));                     // loading door
      parts.push(box(6.4, 0.3, 2.5, w / 2 - 6, 5, d / 2 + 1.2, "yellow"));
      for (let i = 0; i < 4; i++) parts.push(pipe([-w / 2 - 0.8, 1 + i * 1.6, -d / 2 + 2], [-w / 2 - 0.8, 1 + i * 1.6, d / 2 - 2], 0.35));
      parts.push(pipe([-w / 2 - 0.8, 1, d / 2 - 2], [-w / 2 - 0.8, h + 3, d / 2 - 2], 0.5));
      if (kind === "factory") for (const [cx, cz] of [[w / 2 - 4, -d / 2 + 4], [w / 2 - 10, -d / 2 + 4]]) {
        for (let k = 0; k < 6; k++) parts.push(cyl(1.6 - k * 0.08, 1.7 - k * 0.08, 4.5, cx, h + k * 4.5 - 4, cz, k % 2 ? "white" : "red", 14));
      }
      break;
    }
    case "warehouse": {
      parts.push(box(w, h, d, 0, 0, 0, "corrugated"));
      const roof = new THREE.CylinderGeometry(d / 2, d / 2, w, 20, 1, false, 0, Math.PI); roof.rotateZ(Math.PI / 2); roof.rotateY(Math.PI / 2);
      roof.scale(1, 0.25, 1); roof.rotateY(Math.PI / 2); roof.translate(0, h, 0); parts.push({ g: roof, m: "metal" });
      for (let i = 0; i < 5; i++) {
        const x = -w / 2 + 5 + i * ((w - 10) / 4);
        parts.push(box(4.5, 4.5, 0.3, x, 0, d / 2 + 0.15, "darkMetal"), box(5, 0.3, 2, x, 4.6, d / 2 + 1, "yellow"));
      }
      parts.push(box(w, 1.2, 3, 0, 0, d / 2 + 1.5, "concrete"));                              // loading dock
      parts.push(box(w * 0.25, 3, 0.2, -w * 0.3, h - 3.5, d / 2 + 0.12, "warmLight"));
      break;
    }
    case "residential": case "brick-residential": {
      const m = kind === "brick-residential" ? "brick" : "concrete";
      parts.push(box(w, h, d, 0, 0, 0, m, FLOOR_H));
      for (let f = 1; f < floors; f++)                                                       // balconies
        for (let x = -w / 2 + 2.5; x < w / 2 - 1; x += 5) parts.push(box(3, 0.25, 1.3, x, f * FLOOR_H - 0.3, d / 2 + 0.6, "white"));
      parapet(parts, w, d, h, "concrete"); hvac(parts, w, d, h, r, 2);
      for (let i = 0; i < 3; i++) parts.push(box(1.8, 0.15, 1.1, (r() - 0.5) * (w - 4), h + 0.8, (r() - 0.5) * (d - 4), "darkMetal")); // solar water heaters
      break;
    }
    case "tower": break;
  }
  return parts;
}

/** Industrial district dressing: cooling towers, tanks, pipe racks, chimneys (with smoke sources returned). */
export function industrialDecor(w: number, d: number, seed: number): { parts: Part[]; smoke: [number, number, number][] } {
  const r = rng(seed), parts: Part[] = [], smoke: [number, number, number][] = [];
  const pick = r();
  if (pick < 0.35) {
    for (const sx of [-1, 1]) {
      const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new THREE.Vector2(7 - Math.sin(t * Math.PI) * 2.6 + t * 0.6, t * 22)); }
      const g = new THREE.LatheGeometry(pts, 28); g.translate(sx * w * 0.22, 0, 0); parts.push({ g, m: "white" });
      smoke.push([sx * w * 0.22, 23, 0]);
    }
  } else if (pick < 0.7) {
    for (let i = 0; i < 4; i++) {
      const x = -w / 2 + 7 + (i % 2) * (w / 2), z = -d / 2 + 7 + Math.floor(i / 2) * (d / 2);
      parts.push(cyl(5, 5, 9, x, 0, z, "metal", 24), sphere(5, x, 9, z, "metal", true), torus(5.05, 0.15, x, 4.5, z, "gold"));
    }
    parts.push(pipe([-w / 2 + 7, 6, -d / 2 + 7], [w / 2 - 7, 6, -d / 2 + 7], 0.5), pipe([-w / 2 + 7, 6, d / 2 - 7], [w / 2 - 7, 6, d / 2 - 7], 0.5));
  } else {
    parts.push(box(w * 0.6, 9, d * 0.5, 0, 0, 0, "brick", FLOOR_H));
    for (let k = 0; k < 8; k++) parts.push(cyl(1.4, 1.5, 4, w * 0.25, 9 + k * 4 - 9, -d * 0.1, k % 2 ? "white" : "red", 12));
    smoke.push([w * 0.25, 33, -d * 0.1]);
    for (let i = 0; i < 5; i++) parts.push(pipe([-w / 2 + 2, 2 + i, d / 2 - 3], [w / 2 - 2, 2 + i, d / 2 - 3], 0.3, i % 2 ? "gold" : "pipe"));
  }
  for (let x = -w / 2 + 4; x < w / 2 - 2; x += 8) parts.push(box(0.4, 8, 0.4, x, 0, -d / 2 + 2, "darkMetal")); // pipe rack posts
  parts.push(pipe([-w / 2 + 2, 7.8, -d / 2 + 2], [w / 2 - 2, 7.8, -d / 2 + 2], 0.45, "gold"), pipe([-w / 2 + 2, 7, -d / 2 + 2.6], [w / 2 - 2, 7, -d / 2 + 2.6], 0.35));
  return { parts, smoke };
}

export function tree(x: number, z: number, r: () => number): Part[] {
  const h = 3 + r() * 3, kind = r();
  const parts: Part[] = [cyl(0.15, 0.22, h, x, 0, z, "trunk", 6)];
  if (kind < 0.3) {                                                                          // palm
    const g = new THREE.ConeGeometry(2.2, 1.2, 7); g.translate(x, h + 0.4, z); parts.push({ g, m: "plant" });
  } else if (kind < 0.8) { const g = new THREE.IcosahedronGeometry(1.5 + r() * 0.8, 1); g.translate(x, h + 0.6, z); parts.push({ g, m: "plant" }); }
  else { const g = new THREE.ConeGeometry(1.4, 3.2, 8); g.translate(x, h + 1, z); parts.push({ g, m: "plant" }); }
  return parts;
}
