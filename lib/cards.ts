import { sql, ensureSchema } from "./db";
import type { Product } from "./products";
import type { GameKind } from "@/content/games-seed";

/* Cards
   Every listing is minted as a card the moment it's first saved: it gets the next card number (ST-00001 ...)
   and a snapshot of its game stats. From then on the stats are locked. The seller can't change them; only
   admin can, in Admin > Cards, and every admin change is stamped with a date and a note.
   The Game Index (G-0001 ...) holds one card per game title, which new listings start from. */

export const KINDS: GameKind[] = [
  "Classic", "Family", "Strategy", "Party", "Word", "Trivia", "Kids", "Deduction",
  "Abstract", "Dexterity", "Card", "Dice", "Co-op", "Adventure", "Puzzle",
];

export const POWER_STATS = [
  { key: "strategy", label: "Strategy", hint: "How much skill and planning decide it" },
  { key: "luck", label: "Luck", hint: "How much dice, spins and draws decide it" },
  { key: "social", label: "Social", hint: "Talking, bluffing, teams and laughs" },
  { key: "speed", label: "Speed", hint: "Higher is quicker to play" },
] as const;
export type PowerKey = (typeof POWER_STATS)[number]["key"];

/** The locked stats on a minted card. */
export type CardStats = {
  gameNo: string; // the Game Index card it was minted from, if any
  game: string;
  year: string;
  designer: string;
  publisher: string;
  minPlayers: number;
  maxPlayers: number;
  playMinutes: number;
  minAge: number;
  kind: string;
  mechanics: string;
  edition: string; // e.g. "1986 NZ printing, metal tokens"
  strategy: number;
  luck: number;
  social: number;
  speed: number;
  condition: string;
  completeness: string;
  era: string;
  rarity: string;
};

export type Game = {
  id: number;
  game_no: string;
  slug: string;
  name: string;
  year: string;
  designer: string;
  publisher: string;
  min_players: number;
  max_players: number;
  play_minutes: number;
  min_age: number;
  kind: string;
  mechanics: string;
  strategy: number;
  luck: number;
  social: number;
  speed: number;
  blurb: string;
  edited_at: string | null;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(n)));
const num = (v: FormDataEntryValue | null, fallback: number) => {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : fallback;
};
const txt = (v: FormDataEntryValue | null, max = 160) => String(v ?? "").trim().slice(0, max);

/** Reads the card fields shared by the listing forms and the admin card editor. */
export function readCardFields(form: FormData) {
  const minPlayers = clamp(num(form.get("min_players"), 2), 1, 99);
  const maxPlayers = clamp(num(form.get("max_players"), Math.max(minPlayers, 4)), minPlayers, 99);
  const kind = txt(form.get("kind"), 30);
  return {
    gameNo: txt(form.get("game_no"), 12),
    game: txt(form.get("game_name")) || txt(form.get("title")),
    year: txt(form.get("year"), 20),
    designer: txt(form.get("designer")),
    publisher: txt(form.get("publisher")),
    minPlayers,
    maxPlayers,
    playMinutes: clamp(num(form.get("play_minutes"), 30), 1, 1440),
    minAge: clamp(num(form.get("min_age"), 8), 0, 21),
    kind: (KINDS as string[]).includes(kind) ? kind : "Family",
    mechanics: txt(form.get("mechanics"), 120),
    edition: txt(form.get("edition"), 120),
    strategy: clamp(num(form.get("strategy"), 5), 1, 10),
    luck: clamp(num(form.get("luck"), 5), 1, 10),
    social: clamp(num(form.get("social"), 5), 1, 10),
    speed: clamp(num(form.get("speed"), 5), 1, 10),
  };
}

export const playersText = (min: number, max: number) => (min === max ? `${min} players` : `${min} to ${max} players`);

// ---------- Game Index ----------

export async function listGames() {
  await ensureSchema();
  return (await sql()`SELECT * FROM bg_games ORDER BY name`) as Game[];
}

export async function getGame(no: string) {
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM bg_games WHERE upper(game_no) = upper(${no}) OR slug = ${no} LIMIT 1`) as Game[];
  return rows[0] ?? null;
}

/** Next free Game Index number, for games added the first time someone lists them. */
export async function addGameFromCard(c: ReturnType<typeof readCardFields>) {
  const slug = c.game.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (!slug) return null;
  const existing = (await sql()`SELECT game_no FROM bg_games WHERE slug = ${slug} LIMIT 1`) as { game_no: string }[];
  if (existing[0]) return existing[0].game_no;
  const rows = (await sql()`
    INSERT INTO bg_games (game_no, slug, name, year, designer, publisher, min_players, max_players, play_minutes,
                          min_age, kind, mechanics, strategy, luck, social, speed)
    VALUES (${"new-" + slug}, ${slug}, ${c.game}, ${c.year}, ${c.designer}, ${c.publisher}, ${c.minPlayers}, ${c.maxPlayers},
            ${c.playMinutes}, ${c.minAge}, ${c.kind}, ${c.mechanics}, ${c.strategy}, ${c.luck}, ${c.social}, ${c.speed})
    ON CONFLICT (slug) DO NOTHING
    RETURNING id`) as { id: number }[];
  if (!rows[0]) return null;
  const numbered = (await sql()`UPDATE bg_games SET game_no = 'G-' || lpad(id::text, 4, '0') WHERE id = ${rows[0].id}
                                RETURNING game_no`) as { game_no: string }[];
  return numbered[0]?.game_no ?? null;
}

export async function updateGame(no: string, c: ReturnType<typeof readCardFields>, blurb: string) {
  await sql()`UPDATE bg_games SET name = ${c.game}, year = ${c.year}, designer = ${c.designer}, publisher = ${c.publisher},
      min_players = ${c.minPlayers}, max_players = ${c.maxPlayers}, play_minutes = ${c.playMinutes}, min_age = ${c.minAge},
      kind = ${c.kind}, mechanics = ${c.mechanics}, strategy = ${c.strategy}, luck = ${c.luck}, social = ${c.social},
      speed = ${c.speed}, blurb = ${blurb.slice(0, 200)}, edited_at = now()
    WHERE upper(game_no) = upper(${no})`;
}

// ---------- Minted cards ----------

/** Mints a listing: next card number, plus the locked stats snapshot. Only ever runs once per listing. */
export async function mintCard(productId: number, stats: CardStats) {
  const rows = (await sql()`
    UPDATE bg_products
       SET card_no = 'ST-' || lpad(nextval('bg_card_seq')::text, 5, '0'),
           card = ${JSON.stringify(stats)}::jsonb,
           minted_at = now()
     WHERE id = ${productId} AND card_no = ''
     RETURNING card_no`) as { card_no: string }[];
  return rows[0]?.card_no ?? null;
}

/** Admin only: change a minted card's stats. Logged with the date and a note. */
export async function editMintedCard(cardNo: string, stats: CardStats, note: string) {
  await sql()`UPDATE bg_products SET card = ${JSON.stringify(stats)}::jsonb, card_edited_at = now(),
                 card_edit_note = ${note.slice(0, 300)}, players = ${playersText(stats.minPlayers, stats.maxPlayers)},
                 year = ${stats.year}, publisher = ${stats.publisher}, condition = ${stats.condition},
                 completeness = ${stats.completeness}, era = ${stats.era}, updated_at = now()
               WHERE upper(card_no) = upper(${cardNo})`;
}

export async function getProductByCardNo(no: string) {
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM bg_products WHERE upper(card_no) = upper(${no}) LIMIT 1`) as Product[];
  return rows[0] ?? null;
}

/** Stats for a listing: the locked snapshot, or (for anything minted before cards had stats) sensible defaults. */
export function statsOf(p: Product): CardStats {
  const c = (p.card ?? {}) as Partial<CardStats>;
  const players = (p.players.match(/\d+/g) ?? []).map(Number);
  return {
    gameNo: c.gameNo ?? "",
    game: c.game ?? p.title,
    year: c.year ?? p.year,
    designer: c.designer ?? "",
    publisher: c.publisher ?? p.publisher,
    minPlayers: c.minPlayers ?? players[0] ?? 2,
    maxPlayers: c.maxPlayers ?? players[1] ?? players[0] ?? 4,
    playMinutes: c.playMinutes ?? 30,
    minAge: c.minAge ?? 8,
    kind: c.kind ?? "Family",
    mechanics: c.mechanics ?? "",
    edition: c.edition ?? "",
    strategy: c.strategy ?? 5,
    luck: c.luck ?? 5,
    social: c.social ?? 5,
    speed: c.speed ?? 5,
    condition: c.condition ?? p.condition,
    completeness: c.completeness ?? p.completeness,
    era: c.era ?? p.era,
    rarity: c.rarity ?? "",
  };
}

/** Every visible minted card, newest first (for the Player Cards tab). */
export async function listMintedCards() {
  await ensureSchema();
  return (await sql()`SELECT * FROM bg_products WHERE visible AND card_no <> ''
                      ORDER BY (status = 'sold'), minted_at DESC NULLS LAST`) as Product[];
}
