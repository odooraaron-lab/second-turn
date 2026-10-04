import type { Post } from "@/content/types";

/**
 * A tiny generated picture for a blog post, used when a post has no cover image yet.
 * Drawn from the post's slug, so every post gets its own and it never changes. Pure SVG: no image files.
 */

type Palette = { bg: string; a: string; b: string; c: string };

const palettes: Record<Post["category"], Palette> = {
  "classic-games": { bg: "#dbe8d5", a: "#1c2b44", b: "#d23a2a", c: "#f2b632" },
  collecting: { bg: "#f6e7c6", a: "#1c2b44", b: "#2f6db5", c: "#d23a2a" },
  "care-and-repair": { bg: "#e3ecf4", a: "#1c2b44", b: "#3f8a5a", c: "#f2b632" },
  "game-night": { bg: "#f8dcd3", a: "#1c2b44", b: "#2f6db5", c: "#f2b632" },
  "buying-in-nz": { bg: "#e9e2f0", a: "#1c2b44", b: "#d23a2a", c: "#3f8a5a" },
};

function random(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pips: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-1, -1], [1, 1]],
  3: [[-1, -1], [0, 0], [1, 1]],
  4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
  6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};

const die = (x: number, y: number, s: number, n: number, fill: string, pip: string) => (
  <g>
    <rect x={x} y={y} width={s} height={s} rx={s * 0.2} fill={fill} />
    {pips[n].map(([dx, dy], i) => (
      <circle key={i} cx={x + s / 2 + dx * s * 0.26} cy={y + s / 2 + dy * s * 0.26} r={s * 0.09} fill={pip} />
    ))}
  </g>
);

const pawn = (x: number, y: number, fill: string) => (
  <path d={`M${x} ${y}a5 5 0 0 1 3 9c2 2 3 6 4 11H${x - 7}c1-5 2-9 4-11a5 5 0 0 1 3-9Z`} fill={fill} />
);

export function PostThumb({ post, size = 56 }: { post: Pick<Post, "slug" | "category">; size?: number }) {
  const p = palettes[post.category] ?? palettes["classic-games"];
  const r = random(post.slug);
  const j = (n: number) => Math.round(r() * n);
  const face = 1 + j(5);
  let art: React.ReactNode;

  switch (post.category) {
    case "classic-games":
      art = (
        <>
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={4 + i * 10} y="34" width="9" height="9" rx="1.5" fill={i % 2 ? p.c : "#fffdf7"} />
          ))}
          {pawn(18 + j(14), 12, p.b)}
          {die(30, 8 + j(6), 13, face, p.a, "#fffdf7")}
        </>
      );
      break;
    case "collecting":
      art = (
        <>
          <rect x="6" y="30" width="36" height="7" rx="1.5" fill={p.b} />
          <rect x="9" y="22" width="32" height="7" rx="1.5" fill={p.c} />
          <rect x={7 + j(4)} y="14" width="30" height="7" rx="1.5" fill={p.a} />
          <rect x="6" y="38" width="38" height="5" rx="1.5" fill="#fffdf7" />
        </>
      );
      break;
    case "care-and-repair":
      art = (
        <>
          <rect x="6" y="14" width="36" height="28" rx="3" fill="#fffdf7" stroke={p.a} strokeWidth="2" />
          <rect x="10" y="18" width="12" height="9" rx="2" fill={p.b} />
          <rect x="26" y="18" width="12" height="9" rx="2" fill={p.c} />
          <rect x="10" y="30" width="28" height="8" rx="2" fill={p.a} opacity="0.85" />
        </>
      );
      break;
    case "game-night":
      art = (
        <>
          <rect x="8" y="14" width="16" height="24" rx="2.5" fill="#fffdf7" stroke={p.a} strokeWidth="1.5" transform={`rotate(-12 16 26)`} />
          <rect x="18" y="12" width="16" height="24" rx="2.5" fill={p.b} transform={`rotate(${6 + j(6)} 26 24)`} />
          {die(29, 28, 12, face, p.c, p.a)}
        </>
      );
      break;
    default:
      art = (
        <>
          <rect x="8" y="16" width="30" height="24" rx="2" fill="#c89a64" />
          <rect x="8" y="16" width="30" height="5" fill="#b0824f" />
          <circle cx={36 + j(2)} cy="14" r="6" fill={p.c} />
          {pawn(21, 22, p.b)}
        </>
      );
  }

  return (
    <svg className="post-thumb" width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect width="48" height="48" fill={p.bg} />
      {art}
    </svg>
  );
}
