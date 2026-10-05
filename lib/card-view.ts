import type { Product } from "./products";
import { publicStatus, isNew } from "./products";
import { statsOf, type Game } from "./cards";
import { FRAMES, HOLO, ORBS, rarityOf, type Rarity } from "./collector";
import { site, conditionOf, completenessOf } from "@/site.config";
import { formatNzd } from "./format";

/** Everything a card face shows, for a minted listing or a Game Index card. */
export type CardView = {
  no: string;
  type: "minted" | "index";
  title: string;
  sub: string;
  stage: string;
  rarity: Rarity;
  frame: (typeof FRAMES)[Rarity];
  holo: boolean;
  status: "available" | "reserved" | "sold" | "index" | "pending";
  price: string;
  image: string;
  blur?: string;
  artSeed: string;
  players: string;
  minutes: string;
  age: string;
  power: { strategy: number; luck: number; social: number; speed: number };
  kind: string;
  mechanics: string;
  designer: string;
  edition: string;
  completeness: { id: string; label: string } | null;
  condition: { label: string; orbs: number } | null;
  fresh: boolean;
  line: string;
};

const players = (min: number, max: number) => (min === max ? `${min}` : `${min}–${max}`);
const minutes = (m: number) => (m >= 120 && m % 60 === 0 ? `${m / 60} hr` : `${m} min`);

export function viewFromProduct(p: Product): CardView {
  const s = statsOf(p);
  const rarity = ((s.rarity as Rarity) || rarityOf(p)) as Rarity;
  const status = p.review === "pending" ? "pending" : publicStatus(p);
  const era = site.eras.find((e) => e.id === s.era);
  const condition = conditionOf(s.condition);
  const complete = completenessOf(s.completeness);
  return {
    no: p.card_no || `ST-?`,
    type: "minted",
    title: p.title,
    sub: [s.year, s.publisher].filter(Boolean).join(" · "),
    stage: era ? era.short : s.kind,
    rarity,
    frame: FRAMES[rarity] ?? FRAMES.Common,
    holo: HOLO.has(rarity),
    status,
    price: formatNzd(p.price_cents),
    image: p.images[0] ?? "",
    blur: p.images[0] ? p.blurs?.[p.images[0]] : undefined,
    artSeed: s.game || p.title,
    players: players(s.minPlayers, s.maxPlayers),
    minutes: minutes(s.playMinutes),
    age: `${s.minAge}+`,
    power: { strategy: s.strategy, luck: s.luck, social: s.social, speed: s.speed },
    kind: s.kind,
    mechanics: s.mechanics,
    designer: s.designer,
    edition: s.edition,
    completeness: complete ? { id: complete.id, label: complete.label } : null,
    condition: condition ? { label: condition.label, orbs: ORBS[condition.id] ?? 2 } : null,
    fresh: status === "available" && isNew(p),
    line: s.edition || (complete?.id === "missing" ? p.description.split("\n")[0].slice(0, 90) : ""),
  };
}

export function viewFromGame(g: Game): CardView {
  return {
    no: g.game_no,
    type: "index",
    title: g.name,
    sub: [g.year, g.publisher].filter(Boolean).join(" · "),
    stage: g.kind,
    rarity: "Index",
    frame: FRAMES.Index,
    holo: false,
    status: "index",
    price: "",
    image: "",
    artSeed: g.name,
    players: players(g.min_players, g.max_players),
    minutes: minutes(g.play_minutes),
    age: `${g.min_age}+`,
    power: { strategy: g.strategy, luck: g.luck, social: g.social, speed: g.speed },
    kind: g.kind,
    mechanics: g.mechanics,
    designer: g.designer,
    edition: "",
    completeness: null,
    condition: null,
    fresh: false,
    line: g.blurb,
  };
}
