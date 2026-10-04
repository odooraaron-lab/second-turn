"use client";

import { useCallback, useRef } from "react";

/** The card leans towards the pointer with a glare, like holding it up to the light. Mouse only. */
export function TiltCard({ className, style, children }: { className: string; style: React.CSSProperties; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const onMove = useCallback((e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--rx", `${(0.5 - y) * 14}deg`);
    el.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  }, []);
  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.style.setProperty("--mx", "50%");
    el.style.setProperty("--my", "30%");
  }, []);
  return (
    <article ref={ref} className={className} style={style} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </article>
  );
}
