import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OC } from "three-stdlib";
import { useWorld } from "./store";

/**
 * Camera: 360° orbit, zoom, pan (mouse / one-finger rotate, two-finger pinch+pan), smooth fly-to for buildings,
 * floors, rooms and agents; isometric preset; free camera; hotkeys:
 *   WASD/arrows pan · Q/E rotate · +/- zoom · Esc back · H home · I isometric · F free camera · 1–9 floors
 */
export function CameraRig() {
  const ctl = useRef<OC>(null!);
  const { camera } = useThree();
  const goal = useWorld((s) => s.camGoal), freeCam = useWorld((s) => s.freeCam), view = useWorld((s) => s.view);
  const keys = useRef(new Set<string>());
  const sph = useRef(new THREE.Spherical()), tmp = useRef(new THREE.Vector3());

  useEffect(() => {
    // test hook: world → screen projection (used by automated UI tests to click real 3D objects)
    (window as any).__jarvisProject = (x: number, y: number, z: number) => {
      const v = new THREE.Vector3(x, y, z).project(camera);
      return [((v.x + 1) / 2) * window.innerWidth, ((1 - v.y) / 2) * window.innerHeight];
    };
  }, [camera]);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest?.("input,textarea,select")) return;
      const k = e.key.toLowerCase(), s = useWorld.getState();
      keys.current.add(k);
      if (k === "escape") s.back();
      else if (k === "h") s.home();
      else if (k === "i") s.setIso(!s.iso);
      else if (k === "f") s.setFreeCam(!s.freeCam);
      else if (/^[1-9]$/.test(k) && s.building) s.setFloor(Number(k) - 1);
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  useFrame((_, dt) => {
    const c = ctl.current; if (!c) return;
    // keyboard pan / rotate / zoom
    const k = keys.current, speed = (freeCam ? 160 : 90) * dt * (camera.position.distanceTo(c.target) / 200 + 0.3);
    const fwd = tmp.current.set(0, 0, 0); camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const move = new THREE.Vector3();
    if (k.has("w") || k.has("arrowup")) move.add(fwd); if (k.has("s") || k.has("arrowdown")) move.sub(fwd);
    if (k.has("d") || k.has("arrowright")) move.add(right); if (k.has("a") || k.has("arrowleft")) move.sub(right);
    if (move.lengthSq()) { move.normalize().multiplyScalar(speed); c.target.add(move); camera.position.add(move); }
    if (k.has("q") || k.has("e") || k.has("+") || k.has("=") || k.has("-")) {
      const off = camera.position.clone().sub(c.target); sph.current.setFromVector3(off);
      if (k.has("q")) sph.current.theta += dt * 1.2; if (k.has("e")) sph.current.theta -= dt * 1.2;
      if (k.has("+") || k.has("=")) sph.current.radius *= 1 - dt * 1.5; if (k.has("-")) sph.current.radius *= 1 + dt * 1.5;
      camera.position.copy(c.target).add(off.setFromSpherical(sph.current));
    }
    // smooth fly-to
    if (goal) {
      const a = 1 - Math.pow(0.0025, dt);
      c.target.lerp(new THREE.Vector3(...goal.target), a);
      const off = camera.position.clone().sub(c.target); sph.current.setFromVector3(off);
      sph.current.radius += (goal.dist - sph.current.radius) * a;
      if (goal.polar !== undefined) sph.current.phi += (goal.polar - sph.current.phi) * a;
      if (goal.azimuth !== undefined) { let d = goal.azimuth - sph.current.theta; d = Math.atan2(Math.sin(d), Math.cos(d)); sph.current.theta += d * a; }
      camera.position.copy(c.target).add(off.setFromSpherical(sph.current));
      if (Math.abs(sph.current.radius - goal.dist) < 0.5 && c.target.distanceTo(new THREE.Vector3(...goal.target)) < 0.5) useWorld.setState({ camGoal: null });
    }
    c.update();
  });

  const iso = useWorld((s) => s.iso);
  useEffect(() => { (camera as THREE.PerspectiveCamera).fov = iso ? 22 : 45; camera.updateProjectionMatrix(); }, [iso, camera]);
  return (
    <OrbitControls ref={ctl as any} makeDefault target={[20, 0, 10]} enableDamping dampingFactor={0.08}
      minDistance={view === "city" ? 30 : 3} maxDistance={freeCam ? 3000 : 1300} maxPolarAngle={freeCam ? Math.PI * 0.95 : Math.PI / 2.08}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }} screenSpacePanning={false} />
  );
}
