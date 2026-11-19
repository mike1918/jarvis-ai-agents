import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Clouds, Ground, Rain, Sky, Stars } from "./Environment";
import { Drones, Pedestrians, Roads, Train, Vehicles } from "./Life";
import { Blocks, Marina, Port, SiteDressing } from "./Blocks";
import { MainBuildings } from "./MainBuildings";
import { CameraRig } from "./CameraRig";
import { sim } from "./sim";
import { useWorld } from "./store";

/** JARVIS AI CITY — ASHDOD 4D world. One shared world model for desktop and phones; detail scales with `low`. */
export default function Scene({ folders, paused, running, low }: { folders: Record<string, string[]>; paused: boolean; running: number; low: boolean }) {
  sim.quality = low ? "low" : "high";
  const view = useWorld((s) => s.view);
  return (
    <Canvas shadows={!low} dpr={low ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !low, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      camera={{ position: [300, 260, 330], fov: 45, near: 0.5, far: 4000 }}
      onPointerMissed={() => { const s = useWorld.getState(); if (s.agent) s.selectAgent(null); }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}>
      <Sky /><Stars /><Clouds /><Rain />
      <Ground />
      <Roads />
      <Blocks low={low} />
      <SiteDressing />
      <Port /><Marina />
      <Train />
      <Vehicles perLane={low ? 3 : 6} />
      {view === "city" && <Pedestrians count={low ? 160 : 420} />}
      {!low && <Drones />}
      <MainBuildings folders={folders} paused={paused} running={running} low={low} />
      <CameraRig />
    </Canvas>
  );
}
