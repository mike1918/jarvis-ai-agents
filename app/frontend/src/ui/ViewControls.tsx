import { useState } from "react";
import { PRESETS, sim } from "../world/sim";
import { useWorld } from "../world/store";

/** Camera and environment controls (visual only — never affect real task execution). */
export default function ViewControls() {
  const iso = useWorld((s) => s.iso), freeCam = useWorld((s) => s.freeCam), weather = useWorld((s) => s.weather);
  const { setIso, setFreeCam, setWeather, home } = useWorld.getState();
  const [, force] = useState(0);
  const at = (h: number) => { sim.live = false; sim.hours = h; force((x) => x + 1); };
  return (
    <div className="viewctl">
      <button onClick={home} title="Общий вид (H)">⌂</button>
      <button className={iso ? "on" : ""} onClick={() => setIso(!iso)} title="Изометрический обзор (I)">ISO</button>
      <button className={freeCam ? "on" : ""} onClick={() => setFreeCam(!freeCam)} title="Свободная камера (F, WASD)">✥</button>
      <span className="sep" />
      <button onClick={() => at(PRESETS.dawn)} title="Рассвет">🌄</button>
      <button onClick={() => at(PRESETS.day)} title="День">☀️</button>
      <button onClick={() => at(PRESETS.sunset)} title="Закат">🌅</button>
      <button onClick={() => at(PRESETS.night)} title="Ночь">🌙</button>
      <span className="sep" />
      {(["clear", "clouds", "rain"] as const).map((w) => (
        <button key={w} className={weather === w ? "on" : ""} onClick={() => setWeather(w)} title="Погода (декоративная)">{w === "clear" ? "◌" : w === "clouds" ? "☁" : "🌧"}</button>
      ))}
    </div>
  );
}
