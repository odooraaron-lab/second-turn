import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/products";
import { cardFor } from "@/lib/collector";
import { TiltCard } from "./TiltCard";

/* A listing as a collector card, ported from the Property Wars trading card:
   bevelled yellow border, face tinted by rarity, art window in a metal frame (holo on Rare and up),
   info strip, ability box, condition orbs with the year as the big number, a stat row,
   flavour text, and the card number. The price hangs off the edge as a tag.
   Styles: app/collector-card.css */

const ICON = {
  players: "M6 7a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 15c0-3 2-5 4.5-5s4.5 2 4.5 5M12.5 7a2 2 0 1 0 0-4M13 10c2 .4 3.5 2.2 3.5 5",
  year: "M3 4h12v11H3zM3 8h12M7 2v4M11 2v4",
  publisher: "M3 3h9l3 3v9H3zM6 9h6M6 12h4",
};
const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 18 18" width="9" height="9" aria-hidden="true">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);

export function CollectorCard({
  product,
  eager,
  lcp,
  href,
  children,
}: {
  product: Product;
  eager?: boolean;
  lcp?: boolean;
  /** Leave out for a card that isn't a link (e.g. the admin preview) */
  href?: string;
  children?: React.ReactNode;
}) {
  const c = cardFor(product);
  const sold = c.status === "sold";
  const icons = [ICON.players, ICON.year, ICON.publisher];

  const face = (
    <div className="pc-face">
      <header className="pc-head">
        <span className="pc-stage">{c.stage}</span>
        <h3 className="pc-name" title={c.title}>
          {c.title}
        </h3>
        <span className="pc-hp">
          {sold && <b>{c.price}</b>}
          <i className="pc-orb" title={c.rarity} style={{ background: c.frame.orb, color: c.frame.orbInk }}>
            {c.frame.mark}
          </i>
        </span>
      </header>

      <div className="pc-art">
        <div className="pc-art-inner">
          {c.image ? (
            <Image
              src={c.image}
              alt=""
              fill
              sizes="(min-width: 720px) 220px, 46vw"
              loading={eager ? "eager" : "lazy"}
              fetchPriority={lcp ? "high" : undefined}
              placeholder={c.blur ? "blur" : "empty"}
              blurDataURL={c.blur}
              draggable={false}
            />
          ) : (
            <span className="pc-art-blank" aria-hidden="true">
              ⚀
            </span>
          )}
          {c.holo && <span className="pc-art-holo" aria-hidden="true" />}
          {sold && <span className="pc-stamp">SOLD</span>}
          {c.status === "reserved" && <span className="pc-stamp pc-stamp-hold">ON HOLD</span>}
          {c.fresh && <span className="pc-stamp pc-stamp-new">JUST IN</span>}
        </div>
      </div>

      <p className="pc-strip">
        {c.strip.length ? (
          c.strip.map((s, i) => (
            <span key={i}>
              <Icon d={icons[i] ?? ICON.publisher} />
              {s}
            </span>
          ))
        ) : (
          <span>Board game</span>
        )}
      </p>

      <div className="pc-body">
        <div className="pc-ability">
          <p>
            <b className={`pc-ability-tag${c.ability.kind === "Trait" ? " is-trait" : ""}`}>{c.ability.kind}</b>
            <b className="pc-ability-name">{c.ability.name}</b>
          </p>
          <p className="pc-ability-text">{c.ability.text}</p>
        </div>

        <div className="pc-move">
          <span className="pc-orbs" aria-label={`Condition ${c.orbs} of 4`}>
            {[0, 1, 2, 3].map((i) => (
              <i
                key={i}
                className={i < c.orbs ? "is-on" : ""}
                style={i < c.orbs ? { background: c.frame.orb, color: c.frame.orbInk } : undefined}
              >
                {i < c.orbs ? "★" : ""}
              </i>
            ))}
          </span>
          <div className="pc-move-body">
            <b>{c.moveLabel}</b>
            {c.moveNote && <small>{c.moveNote}</small>}
          </div>
          {c.moveValue && <span className="pc-dmg">{c.moveValue}</span>}
        </div>

        <div className="pc-foot">
          {c.stats.map((s, i) => (
            <div key={s.label} className={i === 1 ? "is-hero" : ""}>
              <span>{s.label}</span>
              <b>{s.value}</b>
            </div>
          ))}
        </div>

        {c.flavour && (
          <p className="pc-flavour">
            <span>{c.flavour}</span>
          </p>
        )}

        <footer className="pc-credit">
          <span className="pc-illus">{c.credit}</span>
          <span className="pc-no">
            {c.number} <b style={{ color: c.frame.orb }}>{c.frame.mark}</b>
          </span>
        </footer>
      </div>
    </div>
  );

  return (
    <div className={`pc-wrap${sold ? " is-sold" : ""} r-${c.rarity.toLowerCase()}`} style={{ "--accent": c.frame.orb } as React.CSSProperties}>
      <TiltCard
        className={`pc${c.holo ? " is-holo" : ""}${c.rarity === "Sealed" ? " is-gold" : ""}${sold ? " is-sold" : ""}`}
        style={
          {
            "--face1": c.frame.face1,
            "--face2": c.frame.face2,
            "--ink": c.frame.ink,
            "--orb": c.frame.orb,
            "--orb-ink": c.frame.orbInk,
          } as React.CSSProperties
        }
      >
        {href ? (
          <Link href={href} className="pc-link" aria-label={`${c.title}, ${c.rarity.toLowerCase()} card, ${c.price}${sold ? ", sold" : ""}`}>
            {face}
          </Link>
        ) : (
          face
        )}
        {!sold && (
          <span className={`pc-tag${c.rarity === "Sealed" ? " is-gold" : ""}`} aria-hidden="true">
            {c.status === "reserved" && <small>on hold</small>}
            <b>{c.price}</b>
          </span>
        )}
        <span className="pc-glare" aria-hidden="true" />
      </TiltCard>
      <p className="pc-rarity">
        <i style={{ background: c.frame.orb }} aria-hidden="true" />
        {c.rarity}
      </p>
      {children && <div className="pc-action">{children}</div>}
    </div>
  );
}
