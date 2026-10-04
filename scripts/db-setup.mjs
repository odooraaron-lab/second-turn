// Creates the database tables by hand. The site also does this itself on first run, so this is optional.
// Usage: npm run db:setup (reads DATABASE_URL from .env.local)
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it to .env.local first.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const file = readFileSync(new URL("../db/schema.ts", import.meta.url), "utf8");
const schema = file.slice(file.indexOf("`") + 1, file.lastIndexOf("`"))
  .split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");

for (const statement of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
  await sql.query(statement);
}
console.log("Tables ready: bg_products, bg_orders, bg_email_optouts");
