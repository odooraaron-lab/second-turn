"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export function Gallery({ images, title, blurs = {} }: { images: string[]; title: string; blurs?: Record<string, string> }) {
  const track = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ i: number; x: number; y: number } | null>(null);
  const [open, setOpen] = useState<number | null>(null);

  const onScroll = () => {
    const el = track.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };
  const go = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Desktop: the photo follows the cursor at 2x so brushwork and texture can be seen up close.
  const canHoverZoom = () => matchMedia("(hover: hover) and (pointer: fine)").matches;
  const onMove = (i: number) => (e: React.MouseEvent<HTMLElement>) => {
    if (!canHoverZoom()) return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ i, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  // Full-screen viewer: opens on the tapped photo, closes with Escape or the close button.
  useEffect(() => {
    if (open === null) return;
    const v = viewer.current;
    if (v) v.scrollLeft = open * v.clientWidth;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("menu-open");
    };
  }, [open]);

  if (!images.length)
    return (
      <div className="gallery">
        <div className="tabletop">
          <span className="tabletop-empty">Photo coming</span>
        </div>
      </div>
    );

  return (
    <div className="gallery">
      <div className="gallery-track" ref={track} onScroll={onScroll}>
        {images.map((src, i) => (
          <div className="gallery-slide" key={src}>
            <button
              type="button"
              className={`tabletop zoomable${zoom?.i === i ? " is-zoomed" : ""}`}
              aria-label={`View photo ${i + 1} full screen`}
              onMouseMove={onMove(i)}
              onMouseLeave={() => setZoom(null)}
              onClick={() => setOpen(i)}
              style={zoom?.i === i ? ({ "--zx": `${zoom.x}%`, "--zy": `${zoom.y}%` } as React.CSSProperties) : undefined}
            >
              <Image
                src={src}
                alt={i === 0 ? title : `${title}, photo ${i + 1}`}
                fill
                sizes="(min-width: 900px) 55vw, 100vw"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
                placeholder={blurs[src] ? "blur" : "empty"}
                blurDataURL={blurs[src]}
              />
              {zoom?.i === i && (
                // Full-resolution original, fetched only once someone looks closer
                // eslint-disable-next-line @next/next/no-img-element
                <img className="zoom-hires" src={src} alt="" aria-hidden />
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="gallery-under">
        {images.length > 1 && (
          <div className="thumbs">
            {images.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Show photo ${i + 1} of ${images.length}`}
                aria-current={i === index}
                onClick={() => go(i)}
              >
                <Image src={src} alt="" fill sizes="64px" />
              </button>
            ))}
          </div>
        )}
        <p className="zoom-hint">
          <span className="hint-fine">Hover to look closer, click for full screen</span>
          <span className="hint-touch">Tap the photo to see it full screen</span>
        </p>
      </div>

      {open !== null && (
        <div className="viewer" role="dialog" aria-modal="true" aria-label={`${title}, full screen`}>
          <button type="button" className="viewer-close" onClick={() => setOpen(null)}>
            Close
          </button>
          <div className="viewer-track" ref={viewer}>
            {images.map((src, i) => (
              <div className="viewer-slide" key={src}>
                {/* Full-resolution original, so pinch-zoom on a phone shows real detail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={i === 0 ? title : `${title}, photo ${i + 1}`} loading={i === open ? "eager" : "lazy"} decoding="async" />
              </div>
            ))}
          </div>
          {images.length > 1 && <p className="viewer-hint">Swipe for more photos</p>}
        </div>
      )}
    </div>
  );
}
