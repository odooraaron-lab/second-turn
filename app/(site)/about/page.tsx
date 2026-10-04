import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbs, shareImage } from "@/lib/seo";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: `About ${site.name}: second-hand board games, counted and checked`,
  description: `${site.about.short} How every game is checked, photographed, sold and delivered.`.slice(0, 155),
  alternates: { canonical: "/about" },
  openGraph: { title: `About ${site.name}`, url: "/about", images: [shareImage] },
};

const { min: hMin, max: hMax } = site.shipping.handlingDays;

const steps = [
  {
    title: "Found",
    text: "Games come from op shops, fairs, garage sales and families clearing out cupboards. Anything mouldy or water-damaged doesn't make the cut.",
  },
  {
    title: "Counted",
    text: "Everything is tipped out, sorted and counted against the contents list for that edition. Cards are laid out in order so gaps show.",
  },
  {
    title: "Cleaned and photographed",
    text: "Dust off, plastic pieces washed, musty boxes aired. Then photographed in daylight: box, contents and any wear.",
  },
  {
    title: "Labelled honestly",
    text: "Counted complete, Missing pieces (with a list), or Not counted. Plus a condition, from Sealed to For parts.",
  },
  {
    title: "Packed and sent",
    text: `Pieces bagged, gaps filled, box protected, and sent by tracked courier within ${hMax} working days${
      site.pickup.enabled ? `, or ready to collect in ${site.pickup.town}` : ""
    }.`,
  },
];

export default function About() {
  return (
    <div className="wrap">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: `${site.url}/about`,
          name: `About ${site.name}`,
          mainEntity: { "@id": `${site.url}/#store` },
        }}
      />
      <JsonLd
        data={breadcrumbs([
          ["Home", "/"],
          ["About", "/about"],
        ])}
      />

      <header className="page-head about-head">
        <h1>About {site.name}</h1>
        <p>{site.about.short}</p>
      </header>

      <div className="about-body">
        <div className="prose">
          {site.about.long.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        <section id="how-we-check" className="about-steps" aria-labelledby="steps-title">
          <h2 id="steps-title">How a game gets to you</h2>
          <ol>
            {steps.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-faq" aria-labelledby="faq-title">
          <h2 id="faq-title">Good to know</h2>
          <dl>
            <div>
              <dt>What does "Counted complete" mean?</dt>
              <dd>
                Every piece has been counted against the rules for that edition.
                {site.returns.completenessDays > 0 &&
                  ` If something turns out to be missing, tell us within ${site.returns.completenessDays} days of it arriving and we'll find the piece or refund you.`}{" "}
                <Link href="/blog/reading-second-hand-board-game-listings">More on the labels</Link>
              </dd>
            </div>
            <div>
              <dt>Is there only one of each?</dt>
              <dd>Yes. Every listing is a single game. Once it's sold, it's marked Sold and stays on the site for reference.</dd>
            </div>
            <div>
              <dt>How long does delivery take?</dt>
              <dd>
                Games are packed within {hMin} to {hMax} working days and sent by tracked courier anywhere in New Zealand.
                You'll get an email with tracking once it's on its way.
              </dd>
            </div>
            {site.pickup.enabled && (
              <div>
                <dt>Can I pick up?</dt>
                <dd>
                  Yes. Choose "Pick up in {site.pickup.town}" on the game's page before you buy. There's no courier charge,
                  and we'll email to arrange a time.
                </dd>
              </div>
            )}
            <div>
              <dt>Is paying online safe?</dt>
              <dd>Yes. Checkout is handled by Stripe, and card details never reach this site.</dd>
            </div>
            <div>
              <dt>I've lost a piece from my own game. Can you help?</dt>
              <dd>
                Have a look in <Link href="/shop/category/parts">spare pieces and parts</Link>, and read{" "}
                <Link href="/blog/replacing-missing-board-game-pieces">replacing missing pieces</Link>.
                {site.contactEmail && (
                  <>
                    {" "}
                    Or email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> with what you need.
                  </>
                )}
              </dd>
            </div>
          </dl>
        </section>

        <section className="about-cta">
          <h2>Find your game</h2>
          <div className="chips chips-wrap">
            {site.eras.map((e) => (
              <Link key={e.id} href={`/shop/era/${e.id}`} className="chip">
                {e.label}
              </Link>
            ))}
          </div>
          <Link href="/shop" className="btn btn-buy">
            Shop every game
          </Link>
        </section>
      </div>
    </div>
  );
}
