import { del } from "@vercel/blob";
import { sql, ensureSchema } from "./db";
import { getProductById } from "./products";
import { slugify, toCents } from "./format";
import { readCardFields, mintCard, addGameFromCard, getGame, playersText, type CardStats } from "./cards";
import { rarityOf } from "./collector";
import { site } from "@/site.config";

export async function deleteBlobs(urls: string[]) {
  if (!urls.length || !process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(urls).catch((e) => console.error("Photo cleanup failed", e));
}

type Mode = { by: "admin" } | { by: "player"; sellerId: number };
export type SaveResult = { error: string } | { id: number; cardNo: string | null; created: boolean };

/**
 * Saves a listing from the admin form or a player's form.
 * New listings are minted as cards straight away (card number + locked stats).
 * Edits change the listing (photos, title, price...) but never the locked card stats.
 * Player listings start hidden and pending, until admin approves them.
 */
export async function saveListingCore(formData: FormData, mode: Mode): Promise<SaveResult> {
  const id = mode.by === "admin" ? Number(formData.get("id") || 0) : 0;
  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const pick = (name: string, list: { id: string }[], fallback: string) => {
    const v = text(name);
    return list.some((x) => x.id === v) ? v : fallback;
  };
  const title = text("title").slice(0, 120);
  const description = text("description").slice(0, 4000);
  const category = text("category");
  const era = pick("era", site.eras, "");
  const price = toCents(formData.get("price"));
  const shipping = mode.by === "admin" ? toCents(formData.get("shipping")) : site.defaultShippingNzd * 100;
  const intent = String(formData.get("intent") ?? "");

  let images: string[] = [];
  try {
    images = (JSON.parse(String(formData.get("images") ?? "[]")) as unknown[])
      .filter((u): u is string => typeof u === "string" && u.startsWith("https://"))
      .slice(0, 12);
  } catch {
    /* handled below */
  }
  let blurs: Record<string, string> = {};
  try {
    const raw = JSON.parse(String(formData.get("blurs") ?? "{}")) as Record<string, unknown>;
    for (const url of images) {
      const b = raw[url];
      if (typeof b === "string" && b.startsWith("data:image/") && b.length < 3000) blurs[url] = b;
    }
  } catch {
    blurs = {};
  }

  if (!title) return { error: "Add a title." };
  if (!images.length) return { error: "Add at least one photo." };
  if (!Number.isFinite(price) || price < 50) return { error: "Enter a price of at least $0.50." };
  if (!Number.isFinite(shipping) || shipping < 0) return { error: "Enter a courier cost (0 for free)." };
  if (!site.categories.some((c) => c.id === category)) return { error: "Choose a category." };

  await ensureSchema();
  const imagesJson = JSON.stringify(images);
  const blursJson = JSON.stringify(blurs);

  // ----- Editing (admin only). Card stats stay locked; see Admin > Cards to change them.
  if (id) {
    const existing = await getProductById(id);
    if (!existing) return { error: "This listing no longer exists." };
    await sql()`UPDATE bg_products SET
        title = ${title}, description = ${description}, category = ${category}, era = ${era},
        price_cents = ${price}, shipping_cents = ${shipping},
        images = ${imagesJson}::jsonb, blurs = ${blursJson}::jsonb, updated_at = now()
      WHERE id = ${id}`;
    await deleteBlobs(existing.images.filter((u) => !images.includes(u)));
    return { id, cardNo: existing.card_no || null, created: false };
  }

  // ----- New listing: read the card stats, then mint
  const condition = pick("condition", site.conditions, "good");
  const completeness = pick("completeness", site.completeness, "not-counted");
  if (completeness === "missing" && !description)
    return { error: "List what's missing in the description, so buyers know exactly what they're getting." };
  if (formData.get("confirm_lock") !== "on") return { error: "Tick the box to confirm the card stats. They lock once minted." };

  const fields = readCardFields(formData);
  // A game from the Game Index keeps its number; a new title is added to the index for next time.
  let gameNo = fields.gameNo && (await getGame(fields.gameNo)) ? fields.gameNo.toUpperCase() : "";
  if (!gameNo) gameNo = (await addGameFromCard({ ...fields, game: fields.game || title })) ?? "";
  const game = gameNo ? await getGame(gameNo) : null;

  const stats: CardStats = {
    ...fields,
    gameNo,
    game: fields.game || title,
    condition,
    completeness,
    era,
    rarity: rarityOf({ condition, completeness, era, category }),
  };

  const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
  const isPlayer = mode.by === "player";
  const rows = (await sql()`INSERT INTO bg_products
      (slug, title, description, category, era, publisher, players, year, condition, completeness,
       price_cents, shipping_cents, images, blurs, visible, game_id, seller_id, review)
    VALUES (${slug}, ${title}, ${description}, ${category}, ${era}, ${stats.publisher},
            ${playersText(stats.minPlayers, stats.maxPlayers)}, ${stats.year}, ${condition}, ${completeness},
            ${price}, ${shipping}, ${imagesJson}::jsonb, ${blursJson}::jsonb,
            ${isPlayer ? false : intent !== "hide"}, ${game?.id ?? null},
            ${isPlayer ? mode.sellerId : null}, ${isPlayer ? "pending" : "approved"})
    RETURNING id`) as { id: number }[];
  const newId = rows[0].id;
  const cardNo = await mintCard(newId, stats);
  return { id: newId, cardNo, created: true };
}
