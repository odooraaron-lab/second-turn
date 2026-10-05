import { Resend } from "resend";
import { site, eraLabel, conditionOf, completenessOf } from "@/site.config";
import { formatNzd } from "./format";
import { addressLines, type Order } from "./orders";
import { getProductById, listPublicProducts, type Product } from "./products";
import { unsubscribeUrl } from "./unsubscribe";
import { getUserById } from "./users";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Email colours echo Arcade pop: deep violet print and hot pink, kept light so every mail app shows them well.
const INK = "#1b1a3a";
const MUTED = "#5e5a7d";
const LINE = "#ddd8ee";
const RED = "#d93a6a";
const FONT = "Helvetica,Arial,sans-serif";

function layout(heading: string, body: string, footer = "") {
  return `<!doctype html><html><body style="margin:0;background:#efeafd;padding:32px 12px;font-family:${FONT};color:${INK}">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fffdf7;border-radius:10px;border:2px solid ${INK}">
    <tr><td style="padding:30px 26px">
      <p style="margin:0 0 22px;font-size:19px;font-weight:800"><a href="${site.url}" style="color:${INK};text-decoration:none">${esc(site.name)}</a></p>
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;font-weight:800">${esc(heading)}</h1>
      <div style="font-size:15px;line-height:1.6;color:#2c3a52">${body}</div>
    </td></tr>
  </table>
  <p style="max-width:560px;margin:16px auto 0;text-align:center;font-size:12px;line-height:1.6;color:${MUTED}">
    ${esc(site.name)}, ${esc(site.tagline.toLowerCase())}. <a href="${site.url}/shipping-policy" style="color:${MUTED}">Shipping</a> · <a href="${site.url}/returns-policy" style="color:${MUTED}">Returns</a> · <a href="${site.url}/contact" style="color:${MUTED}">Contact</a>${footer}
  </p></body></html>`;
}

const isPickup = (o: Order) => o.delivery === "pickup";

function summary(o: Order) {
  const where = isPickup(o)
    ? `<p style="margin:0 0 4px;color:${MUTED}">Collecting from</p><p style="margin:0">${esc(site.pickup.town)}. ${esc(site.pickup.note)}</p>`
    : `<p style="margin:0 0 4px;color:${MUTED}">Delivering to</p><p style="margin:0">${[o.shipping_name, ...addressLines(o.shipping_address)]
        .filter(Boolean)
        .map(esc)
        .join("<br>")}</p>`;
  return `<table role="presentation" width="100%" style="border-top:1px solid ${LINE};margin:20px 0;font-size:15px">
    <tr><td style="padding:12px 0">${esc(o.product_title)}</td><td align="right">${formatNzd(o.amount_total - o.shipping_amount)}</td></tr>
    <tr><td style="padding:4px 0;color:${MUTED}">${isPickup(o) ? "Pick-up" : "Courier"}</td><td align="right" style="color:${MUTED}">${
      o.shipping_amount ? formatNzd(o.shipping_amount) : "Free"
    }</td></tr>
    <tr><td style="padding:12px 0;border-top:1px solid ${LINE}"><strong>Total paid</strong></td><td align="right" style="border-top:1px solid ${LINE}"><strong>${formatNzd(o.amount_total)}</strong></td></tr>
  </table>
  ${where}`;
}

// ---------- More games ----------

/** Small, fast email image via the site's image optimiser instead of the full-size original. */
const thumb = (src: string) => `${site.url}/_next/image?url=${encodeURIComponent(src)}&w=384&q=75`;
const tracked = (path: string, campaign: string) =>
  `${site.url}${path}?utm_source=email&utm_medium=email&utm_campaign=${campaign}`;

/** Available games to suggest: same decade as the one bought first, then the newest. */
async function suggestions(boughtId: number | null, n = 3, since?: Date): Promise<Product[]> {
  const bought = boughtId ? await getProductById(boughtId).catch(() => null) : null;
  const available = (await listPublicProducts().catch(() => [] as Product[])).filter(
    (p) => p.id !== boughtId && p.status === "available" && p.images.length && (!since || new Date(p.created_at) > since)
  );
  const sameEra = available.filter((p) => bought?.era && p.era === bought.era);
  return [...sameEra, ...available.filter((p) => !sameEra.includes(p))].slice(0, n);
}

function upsell(items: Product[], heading: string, campaign: string) {
  if (!items.length) return "";
  const cells = items
    .map(
      (p) => `<td width="${Math.floor(100 / items.length)}%" valign="top" style="padding:0 6px">
        <a href="${tracked(`/shop/${p.slug}`, campaign)}" style="color:${INK};text-decoration:none">
          <img src="${thumb(p.images[0])}" alt="${esc(p.title)}" width="160" style="display:block;width:100%;max-width:160px;height:auto;background:#e5e0f7;border:0;border-radius:6px">
          <span style="display:block;margin-top:8px;font-weight:700;font-size:14px;line-height:1.3">${esc(p.title)}</span>
          <span style="display:block;font-size:13px;color:${MUTED}">${formatNzd(p.price_cents)}${
            p.completeness === "complete" ? ", counted complete" : ""
          }</span>
        </a></td>`
    )
    .join("");
  return `<div style="margin-top:32px;padding-top:24px;border-top:1px solid ${LINE}">
    <p style="margin:0 0 14px;font-size:18px;font-weight:800;color:${INK}">${esc(heading)}</p>
    <table role="presentation" width="100%" style="margin:0 -6px"><tr>${cells}</tr></table>
    <p style="margin:18px 0 0"><a href="${tracked("/shop", campaign)}" style="color:${RED};font-weight:700">See every game for sale</a></p>
  </div>`;
}

// ---------- Sending ----------

async function send(opts: { to: string; subject: string; html: string; replyTo?: string; headers?: Record<string, string> }) {
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !opts.to) {
    console.warn(`Email skipped (Resend not configured): ${opts.subject}`);
    return false;
  }
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: process.env.EMAIL_FROM, ...opts });
  if (error) console.error("Email failed:", opts.subject, error);
  return !error;
}

const firstName = (o: Order) => esc(o.customer_name.split(" ")[0] || "there");

export async function sendOrderEmails(o: Order) {
  const owner = process.env.OWNER_EMAIL || "";
  const more = await suggestions(o.product_id);
  const bought = o.product_id ? await getProductById(o.product_id).catch(() => null) : null;
  const heading =
    bought?.era && more[0]?.era === bought.era ? `More games from the ${eraLabel(bought.era)}` : "You might also like";
  const checked = bought ? completenessOf(bought.completeness) : null;

  await send({
    to: o.customer_email,
    subject: `Your order: ${o.product_title}`,
    html: layout(
      "Thanks, it's your turn",
      `<p>Hi ${firstName(o)},</p>
       <p>Your payment has gone through and <strong>${esc(o.product_title)}</strong> is yours.${
         checked?.id === "complete" ? " It's been counted piece by piece, and it'll be packed with its pieces bagged so nothing goes walkabout." : ""
       }</p>
       <p>${
         isPickup(o)
           ? `You've chosen to pick it up in ${esc(site.pickup.town)}. We'll email or text you shortly to arrange a time.`
           : `${esc(site.dispatchNote)} You'll get another email with tracking once it's on its way.`
       }</p>
       ${summary(o)}
       <p style="margin-top:24px">Questions about your order? Just reply to this email.</p>
       ${upsell(more, heading, "order-confirmation")}`
    ),
    replyTo: owner || undefined,
  });

  const seller = bought?.seller_id ? await getUserById(bought.seller_id).catch(() => null) : null;
  if (seller?.email) {
    await send({
      to: seller.email,
      subject: `Your card ${bought?.card_no ?? ""} sold: ${o.product_title}`,
      html: layout(
        "Your game sold",
        `<p>Hi ${esc(seller.username)},</p>
         <p><strong>${esc(o.product_title)}</strong> (card ${esc(bought?.card_no ?? "")}) has just sold for ${formatNzd(o.amount_total - o.shipping_amount)}.</p>
         <p>We'll be in touch shortly to arrange getting the game to the buyer and paying you. Please keep it safe and complete until then.</p>`
      ),
      replyTo: owner || undefined,
    });
  }

  await send({
    to: owner,
    subject: `${isPickup(o) ? "Sold (pick-up)" : "Sold"}: ${o.product_title} (${formatNzd(o.amount_total)})`,
    html: layout(
      isPickup(o) ? "Sold: arrange a pick-up" : "You made a sale",
      `<p><strong>${esc(o.product_title)}</strong> has sold and is now marked Sold on the site.</p>
       ${isPickup(o) ? `<p style="padding:10px 12px;background:#dff8f2;border-radius:6px">The buyer is picking up in ${esc(site.pickup.town)}. Get in touch to arrange a time.</p>` : ""}
       ${seller ? `<p style="padding:10px 12px;background:#fdecf2;border-radius:6px">Player listing from <strong>@${esc(seller.username)}</strong> (${esc(seller.email)}). They've been emailed; arrange collection of the game and their payout.</p>` : ""}
       <p><strong>Buyer</strong><br>${esc(o.customer_name)}<br>${esc(o.customer_email)}${o.customer_phone ? `<br>${esc(o.customer_phone)}` : ""}</p>
       ${summary(o)}
       <p style="margin-top:24px"><a href="${site.url}/admin/orders" style="color:${INK}">Open orders in admin</a> to ${
         isPickup(o) ? "mark it collected" : "add tracking when it ships"
       }.</p>`
    ),
    replyTo: o.customer_email,
  });
}

/** Courier orders only; pick-ups are simply marked collected. */
export async function sendShippedEmail(o: Order) {
  if (isPickup(o)) return false;
  const more = await suggestions(o.product_id);
  return send({
    to: o.customer_email,
    subject: `On its way: ${o.product_title}`,
    html: layout(
      "Your game is on its way",
      `<p>Hi ${firstName(o)},</p>
       <p><strong>${esc(o.product_title)}</strong> has been packed, pieces bagged and box padded, and handed to the courier.</p>
       ${o.tracking ? `<p>Tracking number: <strong>${esc(o.tracking)}</strong></p>` : ""}
       <p>Enjoy the first game.</p>
       ${upsell(more, "Just listed", "shipped")}`
    ),
    replyTo: process.env.OWNER_EMAIL || undefined,
  });
}

/** Sent a few weeks after the game left, only to buyers who opted in. Carries an unsubscribe link. */
export async function sendFollowUpEmail(o: Order) {
  const fresh = await suggestions(o.product_id, 3, new Date(o.created_at));
  const more = fresh.length ? fresh : await suggestions(o.product_id, 3);
  if (!more.length) return false; // nothing to show, so don't send an empty nudge
  const unsub = unsubscribeUrl(o.customer_email);
  return send({
    to: o.customer_email,
    subject: `Has ${o.product_title} been played yet?`,
    html: layout(
      "How's game night going?",
      `<p>Hi ${firstName(o)},</p>
       <p>It's been a few weeks since <strong>${esc(o.product_title)}</strong> found its way to you. I hope it's had a few rounds. If anyone's arguing about the rules, <a href="${tracked(
         "/blog/house-rules-that-arent-in-the-rulebook",
         "follow-up"
       )}" style="color:${INK}">this guide to house rules</a> might settle it.</p>
       <p>${fresh.length ? "Here's what's come in since your order." : "Here are a few games still looking for players."} Everything is one-off, so once it's gone, it's gone.</p>
       ${upsell(more, fresh.length ? "Just listed" : "Still available", "follow-up")}`,
      `<br>You're getting this because you asked to hear about new games at checkout. <a href="${unsub}" style="color:${MUTED}">Unsubscribe</a>`
    ),
    replyTo: process.env.OWNER_EMAIL || undefined,
    headers: {
      "List-Unsubscribe": `<${unsub}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

/** A realistic preview of the buyer's confirmation, sent to the owner from the Setup page. */
export async function sendSampleEmail(to: string) {
  if (!to) return false;
  const [game] = await listPublicProducts({ limit: 1 }).catch(() => [] as Product[]);
  const more = await suggestions(game?.id ?? null);
  const condition = game ? conditionOf(game.condition)?.label : "";
  return send({
    to,
    subject: "Sample: what buyers receive after paying",
    html: layout(
      "Thanks, it's your turn",
      `<p style="padding:10px 12px;background:#dff8f2;border-radius:6px">This is a sample of the confirmation buyers get. The real one includes their order and address.</p>
       <p>Hi there,</p>
       <p>Your payment has gone through and <strong>${esc(game?.title ?? "your game")}</strong>${condition ? ` (${esc(condition.toLowerCase())})` : ""} is yours. ${esc(site.dispatchNote)}</p>
       ${upsell(more, "You might also like", "sample")}`
    ),
  });
}
