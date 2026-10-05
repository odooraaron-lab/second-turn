import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, ContactLine } from "@/components/PolicyPage";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: "Returns and refunds policy",
  description: `${site.name} returns and refunds: ${
    site.returns.days ? `${site.returns.days}-day returns` : "faulty or not-as-described games put right"
  }, the counted-complete promise, cancellations, and how refunds are paid.`,
  alternates: { canonical: "/returns-policy" },
};

export default function ReturnsPolicy() {
  const r = site.returns;
  return (
    <PolicyPage
      title="Returns and refunds policy"
      path="/returns-policy"
      intro={
        r.days
          ? `You can return a game within ${r.days} days of delivery. Faulty or not-as-described games are always put right.`
          : "Every game is one-off and second hand, so we don't accept change-of-mind returns. Faulty, damaged or not-as-described games are always put right."
      }
    >
      <h2 id="summary">At a glance</h2>
      <ul>
        <li>
          <strong>Change of mind:</strong>{" "}
          {r.days ? `returns accepted within ${r.days} days of delivery.` : "not accepted."}
        </li>
        <li>
          <strong>Faulty, damaged in transit, or not as described:</strong> replacement or full refund, including shipping.
        </li>
        {r.completenessDays > 0 && (
          <li>
            <strong>Counted complete but a piece is missing:</strong> tell us within {r.completenessDays} days and we'll find
            the piece or refund you.
          </li>
        )}
        {r.cancelBeforeDispatch && (
          <li>
            <strong>Cancelling:</strong> free, any time before the order is sent.
          </li>
        )}
        <li>
          <strong>Refunds:</strong> to your original payment method within {r.refundDays} working days of being agreed.
        </li>
      </ul>

      {r.days ? (
        <>
          <h2 id="change-of-mind">Change-of-mind returns</h2>
          <p>
            You can return a game for a refund within {r.days} days of delivery, as long as it comes back complete and in the
            condition it was sent. Contact us first at <ContactLine /> so we know to expect it, then send it back by tracked
            courier. Return shipping is paid by you; the original shipping charge isn't refunded for change-of-mind returns.
            We refund the price of the game once it arrives back and has been checked.
          </p>
        </>
      ) : (
        <>
          <h2 id="change-of-mind">Change-of-mind returns</h2>
          <p>
            Because every game is a single second hand item, described and photographed in detail before you buy, we don't
            offer refunds or returns if you change your mind. Please read the listing, the completeness label and the
            condition carefully, and ask us anything before buying.
          </p>
        </>
      )}

      <h2 id="faulty">Faulty, damaged or not as described</h2>
      <p>
        If a game arrives damaged, or isn't as described in its listing, contact us at <ContactLine /> within{" "}
        {r.damageHours} hours of delivery with photos of the game and the packaging. We'll offer a replacement where we can, or
        a full refund including the shipping you paid. If we ask you to send the game back, we'll pay for the return
        shipping.
      </p>

      {r.completenessDays > 0 && (
        <>
          <h2 id="complete">Our counted-complete promise</h2>
          <p>
            Games labelled <strong>Counted complete</strong> have been counted piece by piece against their rules. If you find
            something missing, tell us within {r.completenessDays} days of delivery. We'll send the missing piece if we can
            find one, or refund the game in full. Games labelled <strong>Missing pieces</strong> or{" "}
            <strong>Not counted</strong> are sold as described and aren't covered by this promise, though they're still
            covered if they're otherwise not as described.
          </p>
        </>
      )}

      {r.cancelBeforeDispatch && (
        <>
          <h2 id="cancel">Cancelling an order</h2>
          <p>
            You can cancel any time before your order has been sent{site.pickup.enabled ? " or collected" : ""}, for a full
            refund. Just email <ContactLine /> with your order details.
          </p>
        </>
      )}

      <h2 id="refunds">How refunds are paid</h2>
      <p>
        Refunds go back to the card or payment method you used, through our payment provider Stripe, within{" "}
        {r.refundDays} working days of the refund being agreed (or of the returned game arriving, where a return is needed).
        Your bank may take a few more days to show it.
      </p>

      <h2 id="exchanges">Exchanges</h2>
      <p>Every game is one-off, so we can't exchange for another copy. We'll refund instead.</p>

      <h2 id="rights">Your rights</h2>
      <p>
        Nothing in this policy affects your rights under the Consumer Guarantees Act 1993 or the Fair Trading Act 1986. Second
        hand goods are covered by the Consumer Guarantees Act, with what counts as acceptable quality taking into account the
        game's age, condition and price, and anything pointed out in its listing.
      </p>

      <h2 id="contact">Starting a return or claim</h2>
      <p>
        Email <ContactLine /> with your name, the game you bought and what's wrong, plus photos if it's damaged or missing
        something. We'll reply within one working day. See also our <Link href="/shipping-policy">shipping policy</Link>.
      </p>
    </PolicyPage>
  );
}
