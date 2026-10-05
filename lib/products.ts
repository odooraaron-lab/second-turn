import { sql, ensureSchema } from "./db";
import { site } from "@/site.config";

export type ProductStatus = "available" | "reserved" | "sold";

export type Product = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  /** Decade, one of site.eras (or "") */
  era: string;
  publisher: string;
  /** e.g. "2 to 6 players" */
  players: string;
  year: string;
  /** One of site.conditions */
  condition: string;
  /** One of site.completeness */
  completeness: string;
  price_cents: number;
  shipping_cents: number;
  images: string[];
  /** Tiny blurred previews keyed by photo URL, shown while the real photo loads */
  blurs: Record<string, string>;
  stripe_product_id: string;
  status: ProductStatus;
  visible: boolean;
  reserved_until: string | null;
  reserved_session_id: string | null;
  sold_at: string | null;
  /** Card number, e.g. ST-00012. Given once, when the listing is first saved, and never changes. */
  card_no: string;
  /** Locked card stats (see lib/cards.ts) */
  card: Record<string, unknown>;
  minted_at: string | null;
  card_edited_at: string | null;
  card_edit_note: string;
  game_id: number | null;
  /** The player who listed it, or null for the shop's own games */
  seller_id: number | null;
  /** Player listings wait for approval: pending, approved or rejected */
  review: string;
  created_at: string;
  updated_at: string;
};

/** A reservation older than its expiry no longer blocks a sale. */
export const isOnHold = (p: Product) =>
  p.status === "reserved" && !!p.reserved_until && new Date(p.reserved_until) > new Date();

export const publicStatus = (p: Product): ProductStatus =>
  p.status === "reserved" && !isOnHold(p) ? "available" : p.status;

/** Listed in the last two weeks */
export const isNew = (p: Product) => Date.now() - new Date(p.created_at).getTime() < 14 * 864e5;

export const blurFor = (p: Pick<Product, "blurs">, url: string) => p.blurs?.[url];

export type ProductFilter = { category?: string; era?: string; price?: string; limit?: number };

/** Visible listings, available first then sold, newest first. The catalogue is small, so filtering happens here. */
export async function listPublicProducts(f: ProductFilter = {}) {
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM bg_products WHERE visible
                            ORDER BY (status = 'sold'), created_at DESC LIMIT 1000`) as Product[];
  const band = site.priceBands.find((b) => b.id === f.price);
  return rows
    .filter((p) => !f.category || p.category === f.category)
    .filter((p) => !f.era || p.era === f.era)
    .filter((p) => !band || (p.price_cents >= band.min && p.price_cents <= band.max))
    .slice(0, f.limit ?? 1000);
}

export async function getPublicProduct(slug: string) {
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM bg_products WHERE slug = ${slug} AND visible LIMIT 1`) as Product[];
  return rows[0] ?? null;
}

export async function listAllProducts() {
  await ensureSchema();
  return (await sql()`SELECT * FROM bg_products ORDER BY created_at DESC`) as Product[];
}

export async function getProductById(id: number) {
  await ensureSchema();
  const rows = (await sql()`SELECT * FROM bg_products WHERE id = ${id} LIMIT 1`) as Product[];
  return rows[0] ?? null;
}
