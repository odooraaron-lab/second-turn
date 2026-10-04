import type { Product } from "./products";
import { publicStatus, isNew } from "./products";
import { site, conditionOf, completenessOf, eraLabel, categoryLabel } from "@/site.config";
import { formatNzd } from "./format";

/* Every listing becomes a collector card automatically, the moment it's saved in admin.
   Nothing extra to fill in: the rarity, card number and stats all come from the listing.

   Rarity is a score out of the three things collectors care about:
     completeness  counted complete 2, not counted 1, missing pieces 0
     condition     sealed 3, like new 2, good 1, well played 0, for parts -1
     age           1960s and earlier 2, 1970s 1, newer 0
   6+ Vintage (holo), 4-5 Rare (holo), 3 Uncommon, otherwise Common.
   Sealed games always get the gold Sealed frame; spare parts are always Common. */

export type Rarity = "Common" | "Uncommon" | "Rare" | "Vintage" | "Sealed";

export const FRAMES: Record<Rarity, { face1: string; face2: string; ink: string; orb: string; orbInk: string; mark: string }> = {
  Common: { face1: "#f4efe3", face2: "#ddd4bf", ink: "#2c2a24", orb: "#a8a08c", orbInk: "#fff", mark: "●" },
  Uncommon: { face1: "#dcf7ef", face2: "#8fe3cf", ink: "#0f3b33", orb: "#1fb59a", orbInk: "#fff", mark: "◆" },
  Rare: { face1: "#e2e6ff", face2: "#a7b2f5", ink: "#1b2160", orb: "#4f5fe0", orbInk: "#fff", mark: "★" },
  Vintage: { face1: "#ffe3ee", face2: "#f6a3c3", ink: "#4d0f2a", orb: "#e0457f", orbInk: "#fff", mark: "✦" },
  Sealed: { face1: "#fbf0c8", face2: "#e6c46a", ink: "#4a3606", orb: "#c9961d", orbInk: "#fff", mark: "✧" },
};
export const HOLO = new Set<Rarity>(["Rare", "Vintage", "Sealed"]);

const COMPLETE: Record<string, number> = { complete: 2, "not-counted": 1, missing: 0 };
const CONDITION: Record<string, number> = { sealed: 3, "like-new": 2, good: 1, "well-played": 0, "for-parts": -1 };
const AGE: Record<string, number> = { "1960s-and-earlier": 2, "1970s": 1 };
// Condition shown as orbs, like a trading card's energy cost
const ORBS: Record<string, number> = { sealed: 4, "like-new": 4, good: 3, "well-played": 2, "for-parts": 1 };

export function rarityOf(p: Pick<Product, "condition" | "completeness" | "era" | "category">): Rarity {
  if (p.category === "parts") return "Common";
  if (p.condition === "sealed") return "Sealed";
  const score = (COMPLETE[p.completeness] ?? 0) + (CONDITION[p.condition] ?? 0) + (AGE[p.era] ?? 0);
  return score >= 6 ? "Vintage" : score >= 4 ? "Rare" : score >= 3 ? "Uncommon" : "Common";
}

export const cardNumber = (id: number) => `No. ${String(id).padStart(4, "0")}`;

/** "2 to 6 players" → "2–6" for the small stat box */
const shortPlayers = (s: string) => {
  const n = s.match(/\d+/g);
  if (!n) return s ? s.slice(0, 6) : "—";
  return n.length > 1 ? `${n[0]}–${n[1]}` : n[0];
};

export function cardFor(p: Product) {
  const rarity = rarityOf(p);
  const status = publicStatus(p);
  const condition = conditionOf(p.condition);
  const complete = completenessOf(p.completeness);
  const era = site.eras.find((e) => e.id === p.era);
  const firstLine = p.description.split(/\n|(?<=\.)\s/)[0]?.trim() ?? "";

  const ability =
    complete?.id === "complete"
      ? { kind: "Ability", name: "Counted complete", text: "Every piece checked against the rules." }
      : complete?.id === "missing"
        ? { kind: "Trait", name: "Missing pieces", text: firstLine || "See the listing for what's missing." }
        : { kind: "Trait", name: "Not counted", text: "Looks full, not yet checked piece by piece." };

  return {
    rarity,
    frame: FRAMES[rarity],
    holo: HOLO.has(rarity),
    status,
    fresh: status === "available" && isNew(p),
    stage: era ? era.short.toUpperCase() : categoryLabel(p.category).split(" ")[0].toUpperCase(),
    title: p.title,
    price: formatNzd(p.price_cents),
    image: p.images[0] ?? "",
    blur: p.images[0] ? p.blurs?.[p.images[0]] : undefined,
    strip: [p.players && `${shortPlayers(p.players)} players`, p.year, p.publisher].filter(Boolean) as string[],
    ability,
    orbs: ORBS[p.condition] ?? 2,
    moveLabel: condition?.label ?? "Condition",
    moveNote: condition?.note ?? "",
    moveValue: p.year || era?.short || "",
    stats: [
      { label: "players", value: p.players ? shortPlayers(p.players) : "—" },
      { label: "courier", value: formatNzd(p.shipping_cents) },
      { label: "pick-up", value: site.pickup.enabled ? "Free" : "—" },
    ],
    flavour: firstLine && complete?.id !== "missing" ? firstLine : condition?.note ?? "",
    credit: [p.publisher, era?.label].filter(Boolean).join(", "),
    number: cardNumber(p.id),
    alt: `${p.title} collector card, ${rarity.toLowerCase()}`,
  };
}
