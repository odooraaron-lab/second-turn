import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { sql, ensureSchema } from "@/lib/db";
import { stripe, SITE_TAG } from "@/lib/stripe";
import { sendOrderEmails } from "@/lib/email";
import type { Order } from "@/lib/orders";
import { getProductById } from "@/lib/products";
import { trySyncToStripe } from "@/lib/stripe-sync";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET ?? "");
  } catch (err) {
    console.error("Webhook signature check failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!event.type.startsWith("checkout.session.")) return NextResponse.json({ ignored: true });

  const session = event.data.object as Stripe.Checkout.Session;
  // Shared Stripe account: ignore sessions from the other sites.
  if (session.metadata?.site !== SITE_TAG) return NextResponse.json({ ignored: true });

  const productId = Number(session.metadata.product_id);

  if (event.type === "checkout.session.expired") {
    await sql()`UPDATE bg_products
                   SET status = 'available', reserved_until = NULL, reserved_session_id = NULL, updated_at = now()
                 WHERE id = ${productId} AND status = 'reserved' AND reserved_session_id = ${session.id}`;
    revalidatePath("/", "layout");
    return NextResponse.json({ released: true });
  }

  const paid =
    (event.type === "checkout.session.completed" && session.payment_status === "paid") ||
    event.type === "checkout.session.async_payment_succeeded";
  if (!paid) return NextResponse.json({ waiting: true });

  const customer = session.customer_details;
  // Newer API versions keep shipping under collected_information.
  const shipping =
    session.collected_information?.shipping_details ??
    (session as unknown as { shipping_details?: Stripe.Checkout.Session.CollectedInformation.ShippingDetails })
      .shipping_details ??
    null;
  const address = shipping?.address ?? customer?.address ?? {};

  await ensureSchema();
  const products = (await sql()`SELECT title, era FROM bg_products WHERE id = ${productId}`) as { title: string; era: string }[];
  const delivery = session.metadata.delivery === "pickup" ? "pickup" : "courier";
  const optIn = session.custom_fields?.find((f) => f.key === "updates")?.dropdown?.value === "yes";

  // Insert once per session; Stripe can deliver the same event more than once.
  const inserted = (await sql()`
    INSERT INTO bg_orders (product_id, product_title, product_era, stripe_session_id, delivery, customer_name, customer_email,
                           customer_phone, shipping_name, shipping_address, amount_total, shipping_amount, marketing_opt_in)
    VALUES (${productId}, ${products[0]?.title ?? "Game"}, ${products[0]?.era ?? ""}, ${session.id}, ${delivery},
            ${customer?.name ?? ""}, ${customer?.email ?? ""}, ${customer?.phone ?? ""}, ${shipping?.name ?? customer?.name ?? ""},
            ${JSON.stringify(delivery === "pickup" ? {} : address)}, ${session.amount_total ?? 0},
            ${session.shipping_cost?.amount_total ?? 0}, ${optIn})
    ON CONFLICT (stripe_session_id) DO NOTHING
    RETURNING *`) as Order[];

  if (inserted[0]) {
    await sql()`UPDATE bg_products
                   SET status = 'sold', sold_at = now(), reserved_until = NULL, reserved_session_id = NULL, updated_at = now()
                 WHERE id = ${productId}`;
    revalidatePath("/", "layout");
    await sendOrderEmails(inserted[0]);
    await trySyncToStripe(await getProductById(productId)); // sold games go inactive in the Stripe catalogue
  }

  return NextResponse.json({ received: true });
}
