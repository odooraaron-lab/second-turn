// Health checks behind the admin Setup page: is Stripe connected properly, and can every listing be bought?
import { stripe } from "./stripe";
import { listAllProducts, type Product } from "./products";
import { site } from "@/site.config";

export type Check = { ok: boolean; label: string; detail: string; warn?: boolean };

export const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.expired",
];
export const webhookUrl = () => `${site.url}/api/stripe/webhook`;

export async function stripeChecks(): Promise<Check[]> {
  const checks: Check[] = [];
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) return [{ ok: false, label: "Stripe key", detail: "STRIPE_SECRET_KEY isn't set in Vercel." }];

  const live = key.startsWith("sk_live_") || key.startsWith("rk_live_");
  checks.push({
    ok: true,
    warn: !live,
    label: "Stripe mode",
    detail: live ? "Live: real cards are charged." : "Test mode: use card 4242 4242 4242 4242. Switch to live keys to take real payments.",
  });

  try {
    const acct = await stripe().accounts.retrieveCurrent();
    const name = acct.business_profile?.name || acct.settings?.dashboard?.display_name || acct.id;
    checks.push({
      ok: acct.charges_enabled,
      label: "Stripe account",
      detail: acct.charges_enabled
        ? `${name} can take payments${acct.country ? ` (${acct.country})` : ""}.`
        : `${name} can't take payments yet. Finish the account details in the Stripe dashboard.`,
    });
  } catch {
    checks.push({ ok: false, label: "Stripe account", detail: "The Stripe key was rejected. Check STRIPE_SECRET_KEY." });
    return checks;
  }

  try {
    const endpoints = await stripe().webhookEndpoints.list({ limit: 100 });
    const ep = endpoints.data.find((e) => e.url === webhookUrl());
    const missing = ep && !ep.enabled_events.includes("*") ? WEBHOOK_EVENTS.filter((e) => !ep.enabled_events.includes(e)) : [];
    checks.push({
      ok: !!ep && ep.status === "enabled" && !missing.length,
      label: "Payment notifications (webhook)",
      detail: !ep
        ? `No webhook points at ${webhookUrl()}. Without it, sold games aren't marked and no emails are sent.`
        : ep.status !== "enabled"
          ? "The webhook exists but is disabled in Stripe."
          : missing.length
            ? `The webhook is missing these events: ${missing.join(", ")}.`
            : `Connected to ${webhookUrl()}.`,
    });
  } catch {
    checks.push({ ok: false, label: "Payment notifications (webhook)", detail: "Couldn't read webhooks from Stripe." });
  }

  checks.push({
    ok: !!process.env.STRIPE_WEBHOOK_SECRET,
    label: "Webhook signing secret",
    detail: process.env.STRIPE_WEBHOOK_SECRET
      ? "Set."
      : "STRIPE_WEBHOOK_SECRET isn't set, so payment notifications will be rejected.",
  });
  return checks;
}

export function siteChecks(): Check[] {
  const url = site.url;
  return [
    {
      ok: url.startsWith("https://") && !url.includes("localhost"),
      label: "Site address",
      detail: url.startsWith("https://") ? url : `NEXT_PUBLIC_SITE_URL is ${url}. Set it to the live https address.`,
    },
    {
      ok: !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM,
      label: "Order emails",
      detail:
        process.env.RESEND_API_KEY && process.env.EMAIL_FROM
          ? `Sending from ${process.env.EMAIL_FROM}.`
          : "Set RESEND_API_KEY and EMAIL_FROM so buyers get their confirmation.",
    },
    {
      ok: !!process.env.OWNER_EMAIL,
      label: "Sale alerts",
      detail: process.env.OWNER_EMAIL ? `Sent to ${process.env.OWNER_EMAIL}.` : "Set OWNER_EMAIL to get an email for each sale.",
    },
    {
      ok: true, // optional extra, so never a blocker
      warn: !process.env.CRON_SECRET,
      label: "Follow-up emails",
      detail: process.env.CRON_SECRET
        ? `Buyers get a follow-up ${site.followUpDays} days after their game ships or is collected.`
        : "Set CRON_SECRET in Vercel to switch on follow-up emails to past buyers.",
    },
  ];
}

export type ListingIssue = { product: Product; problems: string[] };

/** Every visible listing must have a title, photo, a price Stripe accepts and a courier price. */
export async function listingIssues(): Promise<{ total: number; issues: ListingIssue[] }> {
  const all = await listAllProducts();
  const issues = all
    .map((p) => {
      const problems: string[] = [];
      if (!p.title.trim()) problems.push("No title");
      if (!p.images.length) problems.push("No photo");
      if (!(p.price_cents >= 50)) problems.push("No price (Stripe needs at least $0.50)");
      if (!(p.shipping_cents >= 0)) problems.push("No courier price");
      if (process.env.STRIPE_SECRET_KEY && !p.stripe_product_id) problems.push("Not in the Stripe catalogue yet");
      return { product: p, problems };
    })
    .filter((x) => x.problems.length);
  return { total: all.length, issues };
}
