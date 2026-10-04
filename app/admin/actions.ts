"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { del } from "@vercel/blob";
import { sql } from "@/lib/db";
import { requireAdmin, checkCredentials, startSession, endSession } from "@/lib/auth";
import { getProductById, listAllProducts } from "@/lib/products";
import { trySyncToStripe, archiveInStripe } from "@/lib/stripe-sync";
import { ensureSchema } from "@/lib/db";
import { getOrder } from "@/lib/orders";
import { sendShippedEmail } from "@/lib/email";
import { slugify, toCents } from "@/lib/format";
import { site } from "@/site.config";

const refresh = () => revalidatePath("/", "layout");

async function deleteBlobs(urls: string[]) {
  if (!urls.length || !process.env.BLOB_READ_WRITE_TOKEN) return;
  await del(urls).catch((e) => console.error("Photo cleanup failed", e));
}

// ---------- Session ----------

export async function login(formData: FormData) {
  const ok = checkCredentials(String(formData.get("username") ?? ""), String(formData.get("password") ?? ""));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800)); // slows down password guessing
    redirect("/admin/login?error=1");
  }
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

// ---------- Listings ----------

export type SaveState = { error: string };

export async function saveListing(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();

  const id = Number(formData.get("id") || 0);
  const text = (name: string) => String(formData.get(name) ?? "").trim();
  const pick = (name: string, list: { id: string }[], fallback: string) => {
    const v = text(name);
    return list.some((x) => x.id === v) ? v : fallback;
  };
  const title = text("title");
  const description = text("description");
  const category = text("category");
  const era = pick("era", site.eras, "");
  const condition = pick("condition", site.conditions, "good");
  const completeness = pick("completeness", site.completeness, "not-counted");
  const publisher = text("publisher");
  const players = text("players");
  const year = text("year");
  const price = toCents(formData.get("price"));
  const shipping = toCents(formData.get("shipping"));
  const intent = String(formData.get("intent") ?? "");
  let images: string[] = [];
  try {
    images = (JSON.parse(String(formData.get("images") ?? "[]")) as unknown[]).filter(
      (u): u is string => typeof u === "string" && u.startsWith("https://")
    );
  } catch {
    /* handled below */
  }

  let blurs: Record<string, string> = {};
  try {
    const raw = JSON.parse(String(formData.get("blurs") ?? "{}")) as Record<string, unknown>;
    // Keep only previews for photos still on the listing, and only small data URLs.
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
  if (completeness === "missing" && !description)
    return { error: "List what's missing in the description, so buyers know exactly what they're getting." };

  const imagesJson = JSON.stringify(images);
  const blursJson = JSON.stringify(blurs);
  await ensureSchema();

  let savedId = id;
  if (id) {
    const existing = await getProductById(id);
    if (!existing) return { error: "This listing no longer exists." };
    await sql()`UPDATE bg_products SET
        title = ${title}, description = ${description}, category = ${category}, era = ${era}, publisher = ${publisher},
        players = ${players}, year = ${year}, condition = ${condition}, completeness = ${completeness},
        price_cents = ${price}, shipping_cents = ${shipping},
        images = ${imagesJson}::jsonb, blurs = ${blursJson}::jsonb, updated_at = now()
      WHERE id = ${id}`;
    await deleteBlobs(existing.images.filter((u) => !images.includes(u)));
  } else {
    const slug = `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`;
    const rows = (await sql()`INSERT INTO bg_products
        (slug, title, description, category, era, publisher, players, year, condition, completeness,
         price_cents, shipping_cents, images, blurs, visible)
      VALUES (${slug}, ${title}, ${description}, ${category}, ${era}, ${publisher}, ${players}, ${year}, ${condition},
              ${completeness}, ${price}, ${shipping}, ${imagesJson}::jsonb, ${blursJson}::jsonb, ${intent !== "hide"})
      RETURNING id`) as { id: number }[];
    savedId = rows[0].id;
  }

  const synced = await trySyncToStripe(await getProductById(savedId));
  refresh();
  redirect(`/admin?saved=${encodeURIComponent(title)}${synced || !process.env.STRIPE_SECRET_KEY ? "" : "&stripe=failed"}`);
}

export async function setSold(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const sold = formData.get("sold") === "1";
  if (sold) {
    await sql()`UPDATE bg_products SET status = 'sold', sold_at = now(), reserved_until = NULL,
                reserved_session_id = NULL, updated_at = now() WHERE id = ${id}`;
  } else {
    await sql()`UPDATE bg_products SET status = 'available', sold_at = NULL, reserved_until = NULL,
                reserved_session_id = NULL, updated_at = now() WHERE id = ${id}`;
  }
  await trySyncToStripe(await getProductById(id));
  refresh();
  redirect(`/admin/listings/${id}`);
}

export async function setVisible(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const visible = formData.get("visible") === "1";
  await sql()`UPDATE bg_products SET visible = ${visible}, updated_at = now() WHERE id = ${id}`;
  await trySyncToStripe(await getProductById(id));
  refresh();
  redirect(`/admin/listings/${id}`);
}

export async function deleteListing(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const product = await getProductById(id);
  if (product) {
    await archiveInStripe(product.stripe_product_id);
    await sql()`DELETE FROM bg_products WHERE id = ${id}`;
    await deleteBlobs(product.images);
  }
  refresh();
  redirect("/admin?deleted=1");
}

export type WebhookState = { error?: string; secret?: string; done?: string };

/** Creates the Stripe webhook for this site and shows its signing secret once, to paste into Vercel. */
export async function createWebhook(_prev: WebhookState): Promise<WebhookState> {
  await requireAdmin();
  const { stripe } = await import("@/lib/stripe");
  const { webhookUrl, WEBHOOK_EVENTS } = await import("@/lib/checks");
  const url = webhookUrl();
  if (!url.startsWith("https://")) return { error: "Set NEXT_PUBLIC_SITE_URL to the live https address first." };
  try {
    const existing = (await stripe().webhookEndpoints.list({ limit: 100 })).data.find((e) => e.url === url);
    if (existing) {
      await stripe().webhookEndpoints.update(existing.id, {
        enabled_events: WEBHOOK_EVENTS as never,
        disabled: false,
      });
      return { done: "The webhook already existed, so its events were updated. Its signing secret is unchanged." };
    }
    const ep = await stripe().webhookEndpoints.create({
      url,
      enabled_events: WEBHOOK_EVENTS as never,
      description: `${site.name} shop`,
    });
    return { secret: ep.secret ?? "" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Stripe didn't accept the request." };
  }
}

export async function syncAllToStripe() {
  await requireAdmin();
  const all = await listAllProducts();
  let ok = 0;
  for (const p of all) if (await trySyncToStripe(p)) ok++;
  redirect(`/admin/setup?synced=${ok}&of=${all.length}`);
}

/** Sends the owner a sample order confirmation (with real suggestions) to see what buyers get. */
export async function sendTestEmail() {
  await requireAdmin();
  const { sendSampleEmail } = await import("@/lib/email");
  const ok = await sendSampleEmail(process.env.OWNER_EMAIL ?? "");
  redirect(`/admin/setup?test=${ok ? "sent" : "failed"}`);
}

// ---------- Orders ----------

export async function markShipped(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const tracking = String(formData.get("tracking") ?? "").trim();
  await sql()`UPDATE bg_orders SET status = 'shipped', tracking = ${tracking}, shipped_at = now() WHERE id = ${id}`;
  const order = await getOrder(id);
  if (order) await sendShippedEmail(order); // courier orders only; pick-ups are just marked collected
  redirect("/admin/orders");
}
