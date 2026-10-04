// Keeps a matching Product in the Stripe catalogue for every listing, so sales show up against
// the right game in the Stripe dashboard. The price itself always comes from the site at checkout,
// so a price change here can never leave Stripe charging an old amount.
import { sql } from "./db";
import { stripe, SITE_TAG } from "./stripe";
import { site } from "@/site.config";
import type { Product } from "./products";

const productUrl = (p: Product) => `${site.url}/shop/${p.slug}`;

/** Creates or updates the Stripe product for a listing. Returns the Stripe product id. */
export async function syncToStripe(p: Product): Promise<string> {
  const data = {
    name: p.title,
    description: [p.publisher, p.year, p.players].filter(Boolean).join(", ") || undefined,
    images: p.images.slice(0, 8),
    url: productUrl(p),
    // Only games that can actually be bought are active in Stripe.
    active: p.visible && p.status !== "sold",
    metadata: { site: SITE_TAG, listing_id: String(p.id), slug: p.slug },
  };

  if (p.stripe_product_id) {
    try {
      await stripe().products.update(p.stripe_product_id, {
        ...data,
        description: data.description ?? "", // empty string clears an old description
      });
      return p.stripe_product_id;
    } catch (err) {
      // Deleted in the Stripe dashboard: fall through and create a fresh one.
      if ((err as { code?: string }).code !== "resource_missing") throw err;
    }
  }

  const created = await stripe().products.create(data);
  await sql()`UPDATE bg_products SET stripe_product_id = ${created.id} WHERE id = ${p.id}`;
  return created.id;
}

/** Best effort: a Stripe hiccup should never stop a listing being saved. */
export async function trySyncToStripe(p: Product | null) {
  if (!p || !process.env.STRIPE_SECRET_KEY) return false;
  try {
    await syncToStripe(p);
    return true;
  } catch (err) {
    console.error(`Stripe sync failed for listing ${p.id}`, err);
    return false;
  }
}

/** Removed listings are archived in Stripe (products with sales history can't be deleted). */
export async function archiveInStripe(stripeProductId: string) {
  if (!stripeProductId || !process.env.STRIPE_SECRET_KEY) return;
  await stripe()
    .products.update(stripeProductId, { active: false })
    .catch((err) => console.error("Stripe archive failed", err));
}
