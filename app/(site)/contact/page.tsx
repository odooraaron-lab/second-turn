import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/PolicyPage";
import { JsonLd } from "@/components/JsonLd";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get in touch with ${site.name}, second hand board games based in ${site.business.location}. Questions about a game, an order, delivery or a return.`,
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  const b = site.business;
  return (
    <PolicyPage title="Contact us" path="/contact" intro="Questions about a game, an order, delivery or a return? Get in touch.">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          url: `${site.url}/contact`,
          mainEntity: { "@id": `${site.url}/#store` },
        }}
      />
      <dl className="contact-list">
        {site.contactEmail && (
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
            </dd>
          </div>
        )}
        {b.phone && (
          <div>
            <dt>Phone</dt>
            <dd>
              <a href={`tel:${b.phone.replace(/\s/g, "")}`}>{b.phone}</a>
            </dd>
          </div>
        )}
        <div>
          <dt>Based in</dt>
          <dd>{b.location}. Online only{site.pickup.enabled ? `, with pick-up by arrangement in ${site.pickup.town}` : ""}.</dd>
        </div>
        <div>
          <dt>Replies</dt>
          <dd>{b.hours}.</dd>
        </div>
        <div>
          <dt>Business</dt>
          <dd>
            {b.tradingName}
            {b.gstRegistered && b.gstNumber ? `, GST ${b.gstNumber}` : ""}
          </dd>
        </div>
      </dl>
      <p>
        For an order, please include your name and the game you bought. For a return or a missing piece, photos help us sort
        it out quickly; see our <Link href="/returns-policy">returns and refunds policy</Link>.
      </p>
    </PolicyPage>
  );
}
