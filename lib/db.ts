import { neon } from "@neondatabase/serverless";
import { SCHEMA_SQL, POST_SQL } from "@/db/schema";
import { seedGames } from "@/content/games-seed";

let client: ReturnType<typeof neon> | null = null;

export function sql() {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

const TABLES = ["bg_products", "bg_orders", "bg_email_optouts", "bg_users", "bg_games"];

// Columns added after launch. Any that are missing are added automatically, so a database created
// by an older version of the site keeps working without anyone running SQL by hand.
const LATER_COLUMNS: [table: string, column: string, definition: string][] = [
  ["bg_products", "card_no", "TEXT NOT NULL DEFAULT ''"],
  ["bg_products", "card", "JSONB NOT NULL DEFAULT '{}'::jsonb"],
  ["bg_products", "minted_at", "TIMESTAMPTZ"],
  ["bg_products", "card_edited_at", "TIMESTAMPTZ"],
  ["bg_products", "card_edit_note", "TEXT NOT NULL DEFAULT ''"],
  ["bg_products", "game_id", "INTEGER"],
  ["bg_products", "seller_id", "INTEGER"],
  ["bg_products", "review", "TEXT NOT NULL DEFAULT 'approved'"],
];

const schemaStatements = () =>
  SCHEMA_SQL.split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

/** Loads the 100-game starting index (content/games-seed.ts) into an empty bg_games table. */
async function seedGameIndex() {
  const db = sql();
  const [{ n }] = (await db`SELECT count(*)::int AS n FROM bg_games`) as { n: number }[];
  if (n > 0) return;
  const rows = seedGames.map((g, i) => ({
    game_no: `G-${String(i + 1).padStart(4, "0")}`,
    slug: g.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    name: g.name,
    year: g.year,
    designer: g.designer,
    publisher: g.publisher,
    min_players: g.min,
    max_players: g.max,
    play_minutes: g.minutes,
    min_age: g.age,
    kind: g.kind,
    mechanics: g.mechanics,
    strategy: g.strategy,
    luck: g.luck,
    social: g.social,
    speed: g.speed,
    blurb: g.blurb,
  }));
  await db.query(
    `INSERT INTO bg_games (game_no, slug, name, year, designer, publisher, min_players, max_players, play_minutes,
                           min_age, kind, mechanics, strategy, luck, social, speed, blurb)
     SELECT game_no, slug, name, year, designer, publisher, min_players, max_players, play_minutes,
            min_age, kind, mechanics, strategy, luck, social, speed, blurb
       FROM jsonb_to_recordset($1::jsonb) AS x(game_no text, slug text, name text, year text, designer text,
            publisher text, min_players int, max_players int, play_minutes int, min_age int, kind text,
            mechanics text, strategy int, luck int, social int, speed int, blurb text)
     ON CONFLICT DO NOTHING`,
    [JSON.stringify(rows)]
  );
  await db.query(`SELECT setval('bg_games_id_seq', (SELECT max(id) FROM bg_games))`);
}

let schemaReady: Promise<void> | null = null;

/**
 * Makes sure the tables exist and are up to date. Checked once per server instance; cheap after that.
 * A brand-new Neon database is set up on the first visit, and older ones are upgraded in place.
 */
export function ensureSchema() {
  schemaReady ??= (async () => {
    const db = sql();
    const existing = (await db`SELECT table_name, column_name FROM information_schema.columns
                               WHERE table_schema = current_schema()
                                 AND table_name = ANY(${TABLES})`) as { table_name: string; column_name: string }[];
    const tables = new Set(existing.map((r) => r.table_name));
    const have = new Set(existing.map((r) => `${r.table_name}.${r.column_name}`));
    let changed = false;

    if (TABLES.some((t) => !tables.has(t))) {
      for (const statement of schemaStatements()) await db.query(statement);
      changed = true;
    }
    for (const [table, column, definition] of LATER_COLUMNS) {
      // Identifiers come from the constant list above, never from user input.
      if (tables.has(table) && !have.has(`${table}.${column}`)) {
        await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
        changed = true;
      }
    }
    if (changed) for (const statement of POST_SQL) await db.query(statement);
    if (changed || !tables.has("bg_games")) await seedGameIndex();
  })().catch((err) => {
    schemaReady = null; // try again on the next request
    throw err;
  });
  return schemaReady;
}
