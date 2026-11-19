import { useEffect } from "react";
/** Exposes the real top-bar height as a CSS variable so panels below it never overlap on narrow screens. */
export function useTopbarHeight() {
  useEffect(() => {
    const el = document.querySelector(".topbar") as HTMLElement | null;
    if (!el) return;
    const set = () => document.documentElement.style.setProperty("--topbar-h", `${el.getBoundingClientRect().bottom + 6}px`);
    set(); const ro = new ResizeObserver(set); ro.observe(el); window.addEventListener("resize", set);
    return () => { ro.disconnect(); window.removeEventListener("resize", set); };
  });
}
