import type { Metadata } from "next";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: "Delivery, pick-up and returns",
  description: `How ${site.name} couriers second-hand board games across New Zealand${
    site.pickup.enabled ? `, free pick-up in ${site.pickup.town}` : ""
  }, delivery times, returns, the completeness promise and privacy.`,
  alternates: { canonical: "/shipping-and-returns" },
};

export default function Policies() {
  const { handlingDays: h, transitDays: t } = site.shipping;
  const { days, completenessDays } = site.returns;
  const range = (r: { min: number; max: number }) => (r.min === r.max ? `${r.max}` : `${r.min} to ${r.max}`);

  return (
    <div className="wrap">
      <header className="article-head">
        <h1>Delivery, pick-up and returns</h1>
      </header>
      <div className="prose">
        <h2 id="shipping">Courier within New Zealand</h2>
        <p>
          Every game can be sent by tracked courier anywhere in New Zealand. The courier cost is shown on each game's page
          and added at checkout.
        </p>
        <p>
          Orders are packed and handed to the courier within {range(h)} working days. Delivery then usually takes{" "}
          {range(t)} working days, so most orders arrive within {h.min + t.min} to {h.max + t.max} working days. Rural
          addresses can take a little longer.
        </p>
        <p>
          Pieces are bagged, cards banded and gaps filled, so nothing comes loose on the way. You'll get a confirmation
          email when you order and another with your tracking number once it's on its way. We don't currently ship outside
          New Zealand.
        </p>

        {site.pickup.enabled && (
          <>
            <h2 id="pickup">Pick up in {site.pickup.town}</h2>
            <p>
              Choose "Pick up in {site.pickup.town}" on the game's page before you buy. There's no courier charge. Once
              you've paid, we'll email or text to arrange a time that suits.
            </p>
          </>
        )}

        <h2 id="returns">Returns</h2>
        {days ? (
          <p>
            You can return a game within {days} days of delivery for a full refund. Please get in touch first, then send it
            back by tracked courier with all its pieces. Return postage is paid by you.
          </p>
        ) : (
          <p>
            Every game is one-off and second-hand, so we don't accept returns for change of mind. This doesn't affect your
            rights under the Consumer Guarantees Act.
          </p>
        )}
        {completenessDays > 0 && (
          <p id="complete">
            <strong>Our completeness promise.</strong> If a game listed as Counted complete turns out to be missing
            something, let us know within {completenessDays} days of it arriving. We'll find a replacement piece or give
            you a refund.
          </p>
        )}
        <p>
          If a game arrives damaged or isn't as described, please get in touch within 48 hours of delivery with photos of
          the game and its packaging, and we'll put it right.
        </p>

        <h2 id="privacy">Payments and privacy</h2>
        <p>
          Payments are processed securely by Stripe. Card details never reach this website. Your name, email, phone and
          delivery address are used only to deliver your order and contact you about it.
        </p>
        {site.contactEmail && (
          <p>
            Questions? Email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
          </p>
        )}
      </div>
    </div>
  );
}
