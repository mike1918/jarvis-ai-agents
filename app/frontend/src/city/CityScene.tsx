import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { District } from "../types";
import { sim } from "./env";
import { Palms, Sea, SkyController, Stars, Terrain } from "./Nature";
import { Roads, Traffic } from "./Roads";
import { Residential } from "./Residential";
import { Marina, Port } from "./Harbor";
import { TechPark } from "./TechPark";

interface Props {
  districts: District[]; selected: string | null; onSelect: (f: string | null) => void;
  paused: boolean; running: number; mobile: boolean;
}

/** ASHDOD 4D: the 3D city. The whole city is rotated so the coastline runs NNE like Ashdod's. */
export default function CityScene({ districts, selected, onSelect, paused, running, mobile }: Props) {
  sim.quality = mobile ? "low" : "high";
  return (
    <Canvas
      shadows={!mobile}
      dpr={mobile ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !mobile, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      camera={{ position: [210, 170, 260], fov: mobile ? 55 : 45, near: 1, far: 3000 }}
      onPointerMissed={() => onSelect(null)}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; }}
    >
      <SkyController />
      <Stars />
      <group rotation-y={-0.26}>
        <Sea />
        <Terrain />
        <Roads />
        <Traffic count={mobile ? 80 : 160} />
        <Residential />
        <Palms />
        <Port />
        <Marina />
        <TechPark districts={districts} selected={selected} onSelect={(f) => onSelect(f)} paused={paused} running={running} />
      </group>
      <OrbitControls makeDefault target={[30, 10, 10]} maxPolarAngle={Math.PI / 2.15} minDistance={40} maxDistance={900}
        enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}
