import { jerusalemHours, sunState } from "../sim/clock";

/**
 * Visual clock of the world (Asia/Jerusalem). It only drives light, sky and animation speed;
 * it never affects how real agent tasks run.
 */
export const sim = {
  hours: 17.3,
  speed: 60,            // simulated seconds per real second
  live: false,
  paused: false,
  sun: sunState(17.3),
  t: 0,                 // animation time for traffic, ships, people (real seconds, scaled mildly by speed)
  quality: "high" as "high" | "low",
};
export const PRESETS = { dawn: 6.4, day: 12, sunset: 17.7, night: 22.5 };

export function step(dt: number) {
  if (sim.live) sim.hours = jerusalemHours();
  else if (!sim.paused) sim.hours = (sim.hours + (dt * sim.speed) / 3600) % 24;
  sim.sun = sunState(sim.hours);
  sim.t += sim.paused ? 0 : dt;
}
