"use client";

import { useEffect, useRef } from "react";

/**
 * Grid of listings that rise into view as you scroll, a row at a time.
 * Without JavaScript (or with reduced motion) the grid simply shows as normal.
 */
export function RevealGrid({ children, className = "grid" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = ref.current;
    if (!grid || matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;

    const cards = Array.from(grid.children) as HTMLElement[];
    const columns = () => getComputedStyle(grid).gridTemplateColumns.split(" ").length || 1;
    const cols = columns();
    cards.forEach((card, i) => card.style.setProperty("--i", String(i % cols)));
    grid.classList.add("reveal-on");

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [children]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
