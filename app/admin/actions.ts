"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "@/lib/db";
import { requireAdmin, checkCredentials, startSession, endSession } from "@/lib/auth";
import { getProductById, listAllProducts } from "@/lib/products";
import { trySyncToStripe, archiveInStripe } from "@/lib/stripe-sync";
import { ensureSchema } from "@/lib/db";
import { getOrder } from "@/lib/orders";
import { sendShippedEmail } from "@/lib/email";
import { saveListingCore, deleteBlobs } from "@/lib/listings";
import { readCardFields, getGame, updateGame, getProductByCardNo, editMintedCard, statsOf } from "@/lib/cards";
import { rarityOf } from "@/lib/collector";
import { site } from "@/site.config";

const refresh = () => revalidatePath("/", "layout");


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
  const result = await saveListingCore(formData, { by: "admin" });
  if ("error" in result) return result;
  const synced = await trySyncToStripe(await getProductById(result.id));
  refresh();
  const title = String(formData.get("title") ?? "");
  const minted = result.created && result.cardNo ? `&minted=${result.cardNo}` : "";
  redirect(`/admin?saved=${encodeURIComponent(title)}${minted}${synced || !process.env.STRIPE_SECRET_KEY ? "" : "&stripe=failed"}`);
}

// ---------- Player listings ----------

export async function reviewListing(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const approve = formData.get("decision") === "approve";
  await sql()`UPDATE bg_products SET review = ${approve ? "approved" : "rejected"}, visible = ${approve}, updated_at = now()
              WHERE id = ${id} AND seller_id IS NOT NULL`;
  await trySyncToStripe(await getProductById(id));
  refresh();
}

// ---------- Card editor ----------

export type CardEditState = { error: string; saved?: string };

export async function saveCardStats(_prev: CardEditState, formData: FormData): Promise<CardEditState> {
  await requireAdmin();
  const no = String(formData.get("card_no") ?? "").trim().toUpperCase();
  const note = String(formData.get("note") ?? "").trim();
  const fields = readCardFields(formData);
  const pick = (name: string, list: { id: string }[], fallback: string) => {
    const v = String(formData.get(name) ?? "");
    return list.some((x) => x.id === v) ? v : fallback;
  };

  if (no.startsWith("G-")) {
    const game = await getGame(no);
    if (!game) return { error: `No Game Index card ${no}.` };
    await updateGame(no, { ...fields, game: fields.game || game.name }, String(formData.get("blurb") ?? ""));
    refresh();
    return { error: "", saved: `${no} saved.` };
  }

  const product = await getProductByCardNo(no);
  if (!product) return { error: `No card ${no}.` };
  if (!note) return { error: "Add a short note saying why the stats changed. It's kept on the card's record." };
  const before = statsOf(product);
  const condition = pick("condition", site.conditions, before.condition);
  const completeness = pick("completeness", site.completeness, before.completeness);
  const era = pick("era", site.eras, before.era);
  const rarity = String(formData.get("rarity") ?? "") || rarityOf({ condition, completeness, era, category: product.category });
  await editMintedCard(no, { ...before, ...fields, game: fields.game || before.game, gameNo: before.gameNo, condition, completeness, era, rarity }, note);
  await trySyncToStripe(await getProductById(product.id));
  refresh();
  return { error: "", saved: `${no} saved.` };
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
