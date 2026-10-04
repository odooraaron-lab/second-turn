import Stripe from "stripe";

let client: Stripe | null = null;

export function stripe() {
  if (!client) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return client;
}

// The Stripe account is shared with other sites, so every session is tagged
// and the webhook ignores anything that isn't ours.
export const SITE_TAG = "boardgames";
