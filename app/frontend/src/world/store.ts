import { create } from "zustand";
import { api } from "../api";
import type { Limits } from "../types";

export type View = "city" | "cutaway" | "interior";
export type VisualState = "idle" | "assigned" | "walking" | "working" | "reviewing" | "waiting" | "error" | "completed";
export interface AgentVisual { state: VisualState; task_id: number | null; since: number | null; project_id: number | null; runtime?: string | null }

export interface CamGoal { target: [number, number, number]; dist: number; polar?: number; azimuth?: number }

interface S {
  view: View; building: string | null; floor: number; room: string | null; agent: string | null; tower: boolean;
  states: Record<string, AgentVisual>; executor: string; lastEventId: number; limits: Limits | null;
  camGoal: CamGoal | null; iso: boolean; freeCam: boolean; weather: "clear" | "clouds" | "rain";
  openBuilding: (id: string) => void; setFloor: (n: number) => void; enterRoom: (id: string | null) => void;
  back: () => void; home: () => void; selectAgent: (n: string | null) => void; showTower: (v: boolean) => void;
  fly: (g: CamGoal) => void; setIso: (v: boolean) => void; setFreeCam: (v: boolean) => void; setWeather: (w: S["weather"]) => void;
  syncStates: () => Promise<void>; applyEvent: (e: any) => void; setLimits: (l: Limits) => void;
}

/** One store for the whole world. Agent states always come from the server (restored on reload, updated by events). */
export const useWorld = create<S>((set, get) => ({
  view: "city", building: null, floor: 0, room: null, agent: null, tower: false,
  states: {}, executor: "", lastEventId: 0, limits: null,
  camGoal: null, iso: false, freeCam: false, weather: "clouds",
  openBuilding: (id) => set({ building: id, view: "cutaway", floor: -1, room: null, agent: null }),
  setFloor: (n) => set({ floor: n, room: null, view: "cutaway", agent: null }),
  enterRoom: (id) => set(id ? { room: id, view: "interior" } : { room: null, view: "cutaway" }),
  back: () => {
    const s = get();
    if (s.agent) return set({ agent: null });
    if (s.view === "interior") return set({ view: "cutaway", room: null });
    if (s.view === "cutaway" && s.floor >= 0) return set({ floor: -1 });
    if (s.view === "cutaway") return set({ view: "city", building: null, floor: 0 });
  },
  home: () => set({ view: "city", building: null, floor: 0, room: null, agent: null, camGoal: { target: [20, 0, 10], dist: 420, polar: 0.95, azimuth: 0.75 } }),
  selectAgent: (n) => set({ agent: n }),
  showTower: (v) => set({ tower: v }),
  fly: (g) => set({ camGoal: g }),
  setIso: (v) => set({ iso: v, camGoal: v ? { target: [20, 0, 10], dist: 520, polar: 0.96, azimuth: Math.PI / 4 } : get().camGoal }),
  setFreeCam: (v) => set({ freeCam: v }),
  setWeather: (w) => set({ weather: w }),
  setLimits: (l) => set({ limits: l }),
  syncStates: async () => {
    const r = await api("/agent-states");
    set({ states: r.states, executor: r.executor, lastEventId: r.last_event_id });
  },
  applyEvent: (e) => {
    // authoritative state is re-read from the server after events (cheap, and survives missed events)
    if (e.id && e.id > get().lastEventId) set({ lastEventId: e.id });
  },
}));
