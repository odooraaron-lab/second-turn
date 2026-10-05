import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, ContactLine } from "@/components/PolicyPage";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: "Shipping policy: NZ courier and pick-up",
  description: `How ${site.name} sends second hand board games: tracked courier anywhere in New Zealand, costs, handling and delivery times${
    site.pickup.enabled ? `, and free pick-up in ${site.pickup.town}` : ""
  }.`,
  alternates: { canonical: "/shipping-policy" },
};

const range = (r: { min: number; max: number }) => (r.min === r.max ? `${r.max}` : `${r.min} to ${r.max}`);

export default function ShippingPolicy() {
  const { handlingDays: h, transitDays: t } = site.shipping;
  return (
    <PolicyPage
      title="Shipping policy"
      path="/shipping-policy"
      intro={`Every game is sent by tracked courier within New Zealand${site.pickup.enabled ? `, or can be picked up free in ${site.pickup.town}` : ""}.`}
    >
      <h2 id="where">Where we ship</h2>
      <p>We ship to street and rural delivery addresses anywhere in New Zealand. We don't currently ship overseas.</p>

      <h2 id="cost">Shipping cost</h2>
      <p>
        Each game has its own courier price, shown on the game's page next to the price and again at checkout before you
        pay. Most games are ${site.defaultShippingNzd}. The courier price covers tracking and packaging. There are no other
        fees.
      </p>

      <h2 id="times">Handling and delivery times</h2>
      <ul>
        <li>
          <strong>Handling:</strong> orders are packed and handed to the courier within {range(h)} working days of payment.
          Working days are Monday to Friday, not including New Zealand public holidays.
        </li>
        <li>
          <strong>Delivery:</strong> the courier usually takes {range(t)} working days.
        </li>
        <li>
          <strong>Total:</strong> most orders arrive within {h.min + t.min} to {h.max + t.max} working days. Rural addresses
          and some remote areas can take a day or two longer.
        </li>
      </ul>
      <p>Orders placed on a weekend or public holiday start being packed on the next working day.</p>

      <h2 id="tracking">Tracking</h2>
      <p>
        You'll get an email confirming your order, then another with your tracking number once the game is on its way.
      </p>

      <h2 id="packing">How games are packed</h2>
      <p>
        Pieces are bagged, cards banded, and gaps filled so nothing comes loose. The box is wrapped against scuffs and rain,
        and fragile or valuable games go inside a second box. <Link href="/blog/how-board-games-are-couriered-nz">More on packing</Link>.
      </p>

      {site.pickup.enabled && (
        <>
          <h2 id="pickup">Pick-up in {site.pickup.town}</h2>
          <p>
            Choose "Pick up in {site.pickup.town}" on the game's page before you buy. There's no shipping charge. After you
            pay, we'll email or text you to arrange a time and give you the pick-up address. Please collect within 14 days
            unless we've agreed otherwise.
          </p>
        </>
      )}

      <h2 id="problems">Lost, late or damaged parcels</h2>
      <p>
        If your tracking hasn't moved for several working days, or the parcel arrives damaged, contact us at <ContactLine />.
        For damage, please send photos of the game and packaging within {site.returns.damageHours} hours of delivery. We'll
        follow it up with the courier and replace or refund as set out in our{" "}
        <Link href="/returns-policy">returns and refunds policy</Link>.
      </p>

      <h2 id="address">Delivery address</h2>
      <p>
        Please check your address at checkout. If a parcel comes back to us because the address was wrong or incomplete, we'll
        contact you to arrange sending it again; the second courier charge may need to be paid.
      </p>
    </PolicyPage>
  );
}
