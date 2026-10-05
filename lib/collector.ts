/* Card rarity. Worked out once, when a listing is minted, and locked with the rest of its card stats
   (admin can override it in Admin > Cards). It scores the three things collectors care about:
     completeness  counted complete 2, not counted 1, missing pieces 0
     condition     sealed 3, like new 2, good 1, well played 0, for parts -1
     age           1960s and earlier 2, 1970s 1, newer 0
   6+ Vintage (holo), 4-5 Rare (holo), 3 Uncommon, otherwise Common.
   Sealed games always get the gold Sealed frame; spare parts are always Common.
   Game Index cards use the plain Index frame. */

export type Rarity = "Common" | "Uncommon" | "Rare" | "Vintage" | "Sealed" | "Index";

export const FRAMES: Record<Rarity, { face1: string; face2: string; ink: string; orb: string; orbInk: string; mark: string }> = {
  Common: { face1: "#f7f2e6", face2: "#e4dbc6", ink: "#2c2a24", orb: "#8f876f", orbInk: "#fff", mark: "●" },
  Uncommon: { face1: "#e4f9f2", face2: "#a6e8d6", ink: "#0f3b33", orb: "#139b83", orbInk: "#fff", mark: "◆" },
  Rare: { face1: "#e8ebff", face2: "#b4bdf7", ink: "#1b2160", orb: "#4352d6", orbInk: "#fff", mark: "★" },
  Vintage: { face1: "#ffe8f1", face2: "#f7b1cc", ink: "#4d0f2a", orb: "#c9306b", orbInk: "#fff", mark: "✦" },
  Sealed: { face1: "#fcf3d2", face2: "#ebcd7c", ink: "#4a3606", orb: "#a87a10", orbInk: "#fff", mark: "✧" },
  Index: { face1: "#eef0fb", face2: "#d3d7ef", ink: "#1e2140", orb: "#5b5f8f", orbInk: "#fff", mark: "#" },
};
export const HOLO = new Set<Rarity>(["Rare", "Vintage", "Sealed"]);

const COMPLETE: Record<string, number> = { complete: 2, "not-counted": 1, missing: 0 };
const CONDITION: Record<string, number> = { sealed: 3, "like-new": 2, good: 1, "well-played": 0, "for-parts": -1 };
const AGE: Record<string, number> = { "1960s-and-earlier": 2, "1970s": 1 };
/** Condition as orbs out of 4 */
export const ORBS: Record<string, number> = { sealed: 4, "like-new": 4, good: 3, "well-played": 2, "for-parts": 1 };

/** Worked out once, when the card is minted, and locked with the rest of its stats. */
export function rarityOf(p: { condition: string; completeness: string; era: string; category: string }): Rarity {
  if (p.category === "parts") return "Common";
  if (p.condition === "sealed") return "Sealed";
  const score = (COMPLETE[p.completeness] ?? 0) + (CONDITION[p.condition] ?? 0) + (AGE[p.era] ?? 0);
  return score >= 6 ? "Vintage" : score >= 4 ? "Rare" : score >= 3 ? "Uncommon" : "Common";
}
