/** 4D time: simulated clock for Ashdod (Asia/Jerusalem). Hours are a float 0..24. */
export function jerusalemHours(d = new Date()): number {
  const parts: Record<string, string> = {};
  for (const x of new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(d)) parts[x.type] = x.value;
  return (Number(parts.hour) % 24) + Number(parts.minute) / 60 + Number(parts.second) / 3600;
}

export interface SimClock { hours: number; speed: number; live: boolean }

/** speed = simulated seconds per real second. live = follow real Jerusalem time. */
export function advance(c: SimClock, dtSeconds: number): SimClock {
  if (c.live) return { ...c, hours: jerusalemHours() };
  return { ...c, hours: (c.hours + (dtSeconds * c.speed) / 3600 + 24) % 24 };
}

/**
 * Simplified solar path for Ashdod (31.8°N): sunrise ≈ 06:00 over the land (east, +x),
 * sunset ≈ 18:00 into the Mediterranean (west, -x).
 */
export function sunState(hours: number) {
  const a = ((hours - 6) / 12) * Math.PI;
  const elev = Math.sin(a) * 62;
  const dir = { x: Math.cos(a), y: Math.sin(a), z: 0.35 };
  const day = Math.max(0, Math.min(1, (elev + 4) / 14));
  const twilight = elev > -8 ? Math.max(0, 1 - Math.abs(elev) / 10) : 0;
  return { elev, dir, day, night: 1 - day, twilight };
}

export const fmtClock = (h: number) =>
  `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.floor((h % 1) * 60)).padStart(2, "0")}`;
