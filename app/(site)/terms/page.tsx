import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, ContactLine } from "@/components/PolicyPage";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: "Terms of sale",
  description: `The terms for buying second hand board games from ${site.name}: prices, payment, one-off listings, delivery, returns and your rights in New Zealand.`,
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  const b = site.business;
  return (
    <PolicyPage
      title="Terms of sale"
      path="/terms"
      intro={`These terms apply when you buy from ${b.tradingName}, an online shop for second hand board games based in ${b.location}.`}
    >
      <h2 id="who">Who you're buying from</h2>
      <p>
        {b.tradingName}, {b.location}.{b.gstRegistered && b.gstNumber ? ` GST number ${b.gstNumber}.` : ""} Contact:{" "}
        <ContactLine />
        {b.phone ? `, ${b.phone}` : ""}.
      </p>

      <h2 id="items">The games</h2>
      <p>
        Every game is second hand (or sealed and unused, where labelled Sealed) and is a single, one-off item. Each listing
        shows its condition, whether it has been counted complete, and photos of the box and contents. We describe games as
        accurately and honestly as we can; minor wear consistent with age and the stated condition is to be expected. Brand
        and game names are used only to describe the item; we're not connected to or endorsed by the publishers.
      </p>

      <h2 id="prices">Prices</h2>
      <p>
        All prices are in New Zealand dollars.{" "}
        {b.gstRegistered ? "Prices include GST." : "We're not registered for GST, so no GST is charged."} The courier price
        is shown on each game's page and at checkout before you pay. The price you see at checkout is the total you pay.
      </p>

      <h2 id="sellers">Who sells each game</h2>
      <p>
        Most games are sold by {b.tradingName}. Some are listed by other players through their own accounts; we check and
        sell those on their behalf, and the purchase, delivery and returns work exactly the same for you.
      </p>

      <h2 id="buying">Buying and payment</h2>
      <p>
        Choosing <strong>Buy Now</strong> takes you to a secure checkout run by Stripe, where you can pay by card or any
        other method Stripe shows. While you're at checkout the game is held for you for up to 30 minutes, so nobody else
        can buy it. The sale is complete once your payment goes through and you receive our confirmation email. If a game
        becomes unavailable or is listed at an obviously wrong price, we'll contact you and give a full refund.
      </p>

      <h2 id="delivery">Delivery and pick-up</h2>
      <p>
        Delivery and pick-up are covered by our <Link href="/shipping-policy">shipping policy</Link>. Responsibility for the
        game passes to you when it's delivered to your address or collected.
      </p>

      <h2 id="returns">Returns, refunds and cancellations</h2>
      <p>
        See our <Link href="/returns-policy">returns and refunds policy</Link>.
        {site.returns.cancelBeforeDispatch ? " You can cancel for a full refund any time before your order is sent." : ""}
      </p>

      <h2 id="rights">Your rights</h2>
      <p>
        Nothing in these terms limits your rights under the Consumer Guarantees Act 1993, the Fair Trading Act 1986 or any
        other New Zealand consumer law. To the extent the law allows, our liability for any game is limited to the price you
        paid for it plus shipping.
      </p>

      <h2 id="cards">Collector cards</h2>
      <p>
        Every listing is minted as a numbered collector card. Card stats (players, time, age, power ratings, rarity) are a
        guide to the game, not a guarantee; the listing, its photos and its completeness label describe the actual item
        you're buying. We can correct a card's stats if they're wrong, and the card page shows when that happened.
      </p>

      <h2 id="selling">Selling with an account</h2>
      <p>If you make an account and list your own games, these terms apply to you as a seller too:</p>
      <ul>
        <li>You must be 18 or over, and the game must be yours to sell.</li>
        <li>
          Describe the game honestly: completeness, condition and anything missing. Your listing is minted as a card when
          you save it, and the card stats lock. We review every listing before it goes in the shop and may decline or
          remove any listing.
        </li>
        <li>
          When your game sells, we email you to arrange getting it to the buyer and paying you the agreed amount. Keep the
          game complete and safe until then. If it's no longer available, tell us straight away so the buyer can be
          refunded.
        </li>
        <li>
          Buyers are covered by our <Link href="/returns-policy">returns and refunds policy</Link>; a refund for a game that
          wasn't as you described may be taken from what you're paid.
        </li>
        <li>You can withdraw a listing while it's waiting for review, and close your account by emailing us.</li>
      </ul>

      <h2 id="privacy">Privacy</h2>
      <p>
        How we handle your information is set out in our <Link href="/privacy-policy">privacy policy</Link>.
      </p>

      <h2 id="law">Law</h2>
      <p>These terms are governed by New Zealand law, and New Zealand courts have jurisdiction.</p>
    </PolicyPage>
  );
}
