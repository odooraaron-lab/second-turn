import Image from "next/image";
import Link from "next/link";
import type { CardView } from "@/lib/card-view";
import { TiltCard } from "./TiltCard";

/* A collector card. Same skin as the Property Wars trading card (bevelled border, rarity-tinted face,
   holo shine on rare cards, hanging price tag), laid out with room to breathe:
     card number and rarity / name / year and publisher / art / players-time-age /
     four power bars / completeness and condition / designer and how it plays
   Works for minted listings (ST-) and Game Index cards (G-). Styles: app/collector-card.css */

const POWER: { key: keyof CardView["power"]; label: string }[] = [
  { key: "strategy", label: "Strategy" },
  { key: "luck", label: "Luck" },
  { key: "social", label: "Social" },
  { key: "speed", label: "Speed" },
];

function hue(seed: string) {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
}

/** Box-lid style art for cards without a photo (the Game Index) */
function GeneratedArt({ seed, title, kind }: { seed: string; title: string; kind: string }) {
  const h = hue(seed);
  const initials = title
    .replace(/[^A-Za-z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <span className="pc-gen" style={{ "--h": h } as React.CSSProperties} aria-hidden="true">
      <span className="pc-gen-initials">{initials || "?"}</span>
      <span className="pc-gen-kind">{kind}</span>
    </span>
  );
}

export function CollectorCard({
  view: v,
  href,
  eager,
  lcp,
  children,
}: {
  view: CardView;
  href?: string;
  eager?: boolean;
  lcp?: boolean;
  children?: React.ReactNode;
}) {
  const sold = v.status === "sold";
  const face = (
    <div className="pc-face">
      <header className="pc-top">
        <span className="pc-no">{v.no}</span>
        <span className="pc-rare" style={{ background: v.frame.orb, color: v.frame.orbInk }}>
          {v.frame.mark} {v.rarity}
        </span>
      </header>

      <h3 className="pc-name">{v.title}</h3>
      <p className="pc-sub">
        <span className="pc-stage">{v.stage}</span>
        {v.sub && <span>{v.sub}</span>}
      </p>

      <div className="pc-art">
        <div className="pc-art-inner">
          {v.image ? (
            <Image
              src={v.image}
              alt=""
              fill
              sizes="(min-width: 720px) 300px, 90vw"
              loading={eager ? "eager" : "lazy"}
              fetchPriority={lcp ? "high" : undefined}
              placeholder={v.blur ? "blur" : "empty"}
              blurDataURL={v.blur}
              draggable={false}
            />
          ) : (
            <GeneratedArt seed={v.artSeed} title={v.title} kind={v.kind} />
          )}
          {v.holo && <span className="pc-art-holo" aria-hidden="true" />}
          {sold && <span className="pc-stamp">SOLD</span>}
          {v.status === "reserved" && <span className="pc-stamp pc-stamp-hold">ON HOLD</span>}
          {v.status === "pending" && <span className="pc-stamp pc-stamp-hold">IN REVIEW</span>}
          {v.fresh && <span className="pc-stamp pc-stamp-new">JUST IN</span>}
        </div>
      </div>

      <dl className="pc-facts">
        <div>
          <dt>Players</dt>
          <dd>{v.players}</dd>
        </div>
        <div>
          <dt>Time</dt>
          <dd>{v.minutes}</dd>
        </div>
        <div>
          <dt>Age</dt>
          <dd>{v.age}</dd>
        </div>
      </dl>

      <ul className="pc-power" aria-label="Card power, out of 10">
        {POWER.map((p) => (
          <li key={p.key}>
            <span className="pc-power-label">{p.label}</span>
            <span className="pc-bar" aria-hidden="true">
              <i style={{ width: `${v.power[p.key] * 10}%`, background: v.frame.orb }} />
            </span>
            <b>{v.power[p.key]}</b>
          </li>
        ))}
      </ul>

      {(v.completeness || v.condition) && (
        <div className="pc-traits">
          {v.completeness && <span className={`pc-complete is-${v.completeness.id}`}>{v.completeness.label}</span>}
          {v.condition && (
            <span className="pc-cond" aria-label={`Condition ${v.condition.label}, ${v.condition.orbs} of 4`}>
              <span className="pc-orbs" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <i key={i} style={i < v.condition!.orbs ? { background: v.frame.orb } : undefined} />
                ))}
              </span>
              {v.condition.label}
            </span>
          )}
        </div>
      )}

      <footer className="pc-foot">
        {v.mechanics && (
          <p>
            <span>Plays</span> {v.mechanics}
          </p>
        )}
        {v.designer && (
          <p>
            <span>By</span> {v.designer}
          </p>
        )}
        {v.line && <p className="pc-line">{v.line}</p>}
      </footer>
    </div>
  );

  return (
    <div className={`pc-wrap${sold ? " is-sold" : ""} r-${v.rarity.toLowerCase()}`} style={{ "--accent": v.frame.orb } as React.CSSProperties}>
      <TiltCard
        className={`pc${v.holo ? " is-holo" : ""}${v.rarity === "Sealed" ? " is-gold" : ""}${sold ? " is-sold" : ""}`}
        style={
          {
            "--face1": v.frame.face1,
            "--face2": v.frame.face2,
            "--ink": v.frame.ink,
            "--orb": v.frame.orb,
          } as React.CSSProperties
        }
      >
        {href ? (
          <Link
            href={href}
            className="pc-link"
            aria-label={`${v.title}, card ${v.no}, ${v.rarity}${v.price ? `, ${v.price}` : ""}${sold ? ", sold" : ""}`}
          >
            {face}
          </Link>
        ) : (
          face
        )}
        {v.price && !sold && v.status !== "pending" && (
          <span className={`pc-tag${v.rarity === "Sealed" ? " is-gold" : ""}`} aria-hidden="true">
            {v.status === "reserved" && <small>on hold</small>}
            <b>{v.price}</b>
          </span>
        )}
        <span className="pc-glare" aria-hidden="true" />
      </TiltCard>
      {children && <div className="pc-action">{children}</div>}
    </div>
  );
}
