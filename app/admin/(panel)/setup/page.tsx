import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { stripeChecks, siteChecks, listingIssues, type Check } from "@/lib/checks";
import { syncAllToStripe, sendTestEmail } from "../../actions";
import { WebhookButton } from "./WebhookButton";

export const metadata = { title: "Setup" };

type Props = { searchParams: Promise<{ synced?: string; of?: string; test?: string }> };

function CheckList({ checks }: { checks: Check[] }) {
  return (
    <ul className="checks">
      {checks.map((c) => (
        <li key={c.label} className={c.ok ? (c.warn ? "is-warn" : "is-ok") : "is-bad"}>
          <span className="check-mark" aria-hidden>
            {c.ok ? (c.warn ? "!" : "✓") : "✕"}
          </span>
          <span>
            <strong>{c.label}</strong>
            <span className="check-detail">{c.detail}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export default async function Setup({ searchParams }: Props) {
  await requireAdmin();
  const { synced, of, test } = await searchParams;
  const [stripeList, listings] = await Promise.all([stripeChecks(), listingIssues()]);
  const webhookBad = stripeList.some((c) => c.label.startsWith("Payment notifications") && !c.ok);
  const allGood = [...stripeList, ...siteChecks()].every((c) => c.ok) && !listings.issues.length;

  return (
    <>
      <div className="admin-title">
        <h1>Setup</h1>
      </div>
      <p className={`notice ${allGood ? "notice-good" : ""}`} role="status">
        {allGood
          ? "Everything is connected. Every listing can be bought."
          : "A few things need attention before every listing can be bought smoothly."}
      </p>
      {synced && (
        <p className="notice" role="status">
          Synced {synced} of {of} listings to the Stripe catalogue.
        </p>
      )}

      <section className="setup-group">
        <h2>Payments</h2>
        <CheckList checks={stripeList} />
        {webhookBad && <WebhookButton />}
      </section>

      <section className="setup-group">
        <h2>Listings</h2>
        {listings.issues.length ? (
          <ul className="checks">
            {listings.issues.map(({ product, problems }) => (
              <li key={product.id} className="is-bad">
                <span className="check-mark" aria-hidden>
                  ✕
                </span>
                <span>
                  <Link href={`/admin/listings/${product.id}`}>
                    <strong>{product.title || "Untitled"}</strong>
                  </Link>
                  <span className="check-detail">{problems.join(". ")}.</span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <CheckList
            checks={[
              {
                ok: true,
                label: `All ${listings.total} listings are ready`,
                detail: process.env.STRIPE_SECRET_KEY
                  ? "Each has a photo, a price, a courier price and a matching Stripe product."
                  : "Each has a photo, a price and a courier price.",
              },
            ]}
          />
        )}
        <form action={syncAllToStripe} className="setup-action">
          <button className="btn btn-quiet btn-small" type="submit">
            Sync all listings to Stripe
          </button>
          <p className="hint">Updates names, photos and availability in the Stripe catalogue. Prices always come from the site.</p>
        </form>
      </section>

      <section className="setup-group">
        <h2>Site and emails</h2>
        <CheckList checks={siteChecks()} />
        <form action={sendTestEmail} className="setup-action">
          <button className="btn btn-quiet btn-small" type="submit">
            Email me a sample order confirmation
          </button>
          {test === "sent" && <p className="hint">Sent to {process.env.OWNER_EMAIL}. Check the inbox (and spam).</p>}
          {test === "failed" && (
            <p className="form-error">It didn't send. Check RESEND_API_KEY, EMAIL_FROM and OWNER_EMAIL above.</p>
          )}
        </form>
      </section>
    </>
  );
}
