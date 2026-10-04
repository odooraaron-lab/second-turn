import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { sql } from "@/lib/db";
import { stripe, SITE_TAG } from "@/lib/stripe";
import { site, conditionOf } from "@/site.config";
import type { Product } from "@/lib/products";

const HOLD_MINUTES = 31; // Stripe sessions must stay open at least 30 minutes
const COOKIE = "bg_checkout";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const slug = String(form.get("slug") ?? "");
  // Courier unless the buyer chose pick-up on the game's page (and pick-up is switched on).
  const delivery = form.get("delivery") === "pickup" && site.pickup.enabled ? "pickup" : "courier";
  const back = (q: string) => NextResponse.redirect(`${site.url}/shop/${slug}?${q}`, 303);

  // If this browser already started checkout for the game (then hit back), let it try again.
  const previousSession = req.cookies.get(COOKIE)?.value ?? "";

  // Atomically place a hold, so two people can't pay for the same one-off game.
  const held = (await sql()`
    UPDATE bg_products
       SET status = 'reserved',
           reserved_until = now() + interval '32 minutes',
           updated_at = now()
     WHERE slug = ${slug} AND visible
       AND (status = 'available'
            OR (status = 'reserved' AND (reserved_until < now() OR reserved_session_id = ${previousSession})))
     RETURNING *`) as Product[];

  const product = held[0];
  if (!product) return back("unavailable=1");

  if (previousSession && product.reserved_session_id === previousSession) {
    await stripe().checkout.sessions.expire(previousSession).catch(() => {});
  }

  try {
    // The price always comes from the listing. When the game has a product in the Stripe catalogue,
    // the sale is recorded against it; otherwise (or if that product was removed in Stripe) the
    // details are sent inline, so checkout never fails because of the catalogue.
    const summary = [conditionOf(product.condition)?.label, product.publisher, product.year].filter(Boolean).join(", ");
    const inline = {
      name: product.title,
      images: product.images.slice(0, 1),
      ...(summary ? { description: summary } : {}),
    };
    const lineItem = (useCatalogue: boolean) => ({
      quantity: 1,
      price_data: {
        currency: site.currency,
        unit_amount: product.price_cents,
        ...(useCatalogue ? { product: product.stripe_product_id } : { product_data: inline }),
      },
    });

    const courier: Stripe.Checkout.SessionCreateParams.ShippingOption = {
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: "Tracked courier, NZ-wide",
        fixed_amount: { amount: product.shipping_cents, currency: site.currency },
        delivery_estimate: {
          minimum: { unit: "business_day", value: site.shipping.handlingDays.min + site.shipping.transitDays.min },
          maximum: { unit: "business_day", value: site.shipping.handlingDays.max + site.shipping.transitDays.max },
        },
      },
    };
    const metadata = { site: SITE_TAG, product_id: String(product.id), delivery };

    const createSession = (useCatalogue: boolean) =>
      stripe().checkout.sessions.create({
        mode: "payment",
        line_items: [lineItem(useCatalogue)],
        // Pick-up orders don't need an address; the phone number is for arranging a time.
        ...(delivery === "courier"
          ? { shipping_address_collection: { allowed_countries: ["NZ"] }, shipping_options: [courier] }
          : {
              custom_text: {
                submit: { message: `Pick up in ${site.pickup.town}. ${site.pickup.note}` },
              },
            }),
        phone_number_collection: { enabled: true },
        // Optional opt-in for "new games" emails (NZ law needs consent for marketing emails).
        custom_fields: [
          {
            key: "updates",
            label: { type: "custom", custom: "Email me when new games are listed?" },
            type: "dropdown",
            optional: true,
            dropdown: {
              options: [
                { label: "Yes please", value: "yes" },
                { label: "No thanks", value: "no" },
              ],
            },
          },
        ],
        metadata,
        payment_intent_data: { metadata },
        expires_at: Math.floor(Date.now() / 1000) + HOLD_MINUTES * 60,
        success_url: `${site.url}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${site.url}/shop/${product.slug}`,
      });

    let session;
    try {
      session = await createSession(!!product.stripe_product_id);
    } catch (err) {
      if (!product.stripe_product_id) throw err;
      console.warn("Checkout with catalogue product failed, retrying inline", err);
      session = await createSession(false);
    }

    await sql()`UPDATE bg_products SET reserved_session_id = ${session.id} WHERE id = ${product.id}`;

    const res = NextResponse.redirect(session.url!, 303);
    res.cookies.set(COOKIE, session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: HOLD_MINUTES * 60,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("Checkout failed", err);
    await sql()`UPDATE bg_products SET status = 'available', reserved_until = NULL, reserved_session_id = NULL
                WHERE id = ${product.id} AND status = 'reserved'`;
    return back("error=1");
  }
}
