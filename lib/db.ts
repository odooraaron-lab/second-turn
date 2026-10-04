import { neon } from "@neondatabase/serverless";
import { SCHEMA_SQL } from "@/db/schema";

let client: ReturnType<typeof neon> | null = null;

export function sql() {
  if (!client) {
    if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
    client = neon(process.env.DATABASE_URL);
  }
  return client;
}

// Columns added after launch. Any that are missing are added automatically, so a database created
// by an older version of the site keeps working without anyone running SQL by hand.
const LATER_COLUMNS: [table: string, column: string, definition: string][] = [
  // e.g. ["bg_products", "box_size", "TEXT NOT NULL DEFAULT ''"],
];

const schemaStatements = () =>
  SCHEMA_SQL.split("\n")
    .filter((l) => !l.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

let schemaReady: Promise<void> | null = null;

/**
 * Makes sure the tables exist. Checked once per server instance; cheap after that.
 * A brand-new Neon database is set up on the first visit, so there is no SQL to run by hand.
 */
export function ensureSchema() {
  schemaReady ??= (async () => {
    const db = sql();
    const existing = (await db`SELECT table_name, column_name FROM information_schema.columns
                               WHERE table_schema = current_schema()
                                 AND table_name IN ('bg_products', 'bg_orders', 'bg_email_optouts')`) as {
      table_name: string;
      column_name: string;
    }[];
    const tables = new Set(existing.map((r) => r.table_name));
    if (tables.size < 3) {
      for (const statement of schemaStatements()) await db.query(statement);
    }
    const have = new Set(existing.map((r) => `${r.table_name}.${r.column_name}`));
    for (const [table, column, definition] of LATER_COLUMNS) {
      // Identifiers come from the constant list above, never from user input.
      if (!have.has(`${table}.${column}`)) await db.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
    }
  })().catch((err) => {
    schemaReady = null; // try again on the next request
    throw err;
  });
  return schemaReady;
}
