import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gallery } from "./Gallery";
import { JsonLd } from "@/components/JsonLd";
import { StatusPrice, CompleteLine, productAlt, ProductCard } from "@/components/ProductCard";
import { getPublicProduct, listPublicProducts, publicStatus } from "@/lib/products";
import { formatNzd } from "@/lib/format";
import { offerShipping, returnPolicy } from "@/lib/schema";
import { site, categoryLabel, eraLabel, conditionOf, completenessOf } from "@/site.config";
import { breadcrumbs } from "@/lib/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ unavailable?: string; error?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPublicProduct(slug);
  if (!p) return { title: "Game not found" };
  const condition = conditionOf(p.condition);
  const complete = completenessOf(p.completeness);
  // Lead with the game, finish with what makes someone click: complete, NZ, price.
  const clip = (t: string, n: number) => (t.length <= n ? t : `${t.slice(0, t.lastIndexOf(" ", n))}…`);
  const facts = [
    "Second-hand",
    complete?.id === "complete" ? "counted complete" : complete?.id === "missing" ? "some pieces missing" : "",
    p.status === "sold" ? "" : formatNzd(p.price_cents),
  ]
    .filter(Boolean)
    .join(", ");
  const tail = `${facts}. NZ-wide courier${site.pickup.enabled ? ` or pick up in ${site.pickup.town}` : ""}.`;
  const lead = (p.description || `${p.title}${p.publisher ? ` by ${p.publisher}` : ""}${p.year ? `, ${p.year}` : ""}${condition ? `, ${condition.label.toLowerCase()} condition` : ""}.`)
    .replace(/\s+/g, " ")
    .trim();
  const description = `${clip(lead, 152 - tail.length)} ${tail}`;
  const title = `${p.title}${p.year ? ` (${p.year})` : ""}${p.category === "parts" ? "" : ", second-hand"}`;
  return {
    title,
    description,
    alternates: { canonical: `/shop/${p.slug}` },
    openGraph: {
      type: "website",
      title: `${title} | ${site.name}`,
      description,
      url: `/shop/${p.slug}`,
      images: p.images.slice(0, 1).map((url) => ({ url, alt: productAlt(p) })),
    },
    twitter: { card: "summary_large_image", title, description, images: p.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { unavailable, error } = await searchParams;
  const p = await getPublicProduct(slug);
  if (!p) notFound();

  const status = publicStatus(p);
  const condition = conditionOf(p.condition);
  const complete = completenessOf(p.completeness);
  // Same decade first, then same category, then anything else available.
  const others = (await listPublicProducts()).filter((x) => x.id !== p.id && x.status !== "sold");
  const rank = (x: (typeof others)[number]) => (p.era && x.era === p.era ? 0 : x.category === p.category ? 1 : 2);
  const related = [...others].sort((a, b) => rank(a) - rank(b)).slice(0, 4);
  const relatedSameEra = !!p.era && related[0]?.era === p.era;

  const crumbs: [string, string][] = [
    ["Home", "/"],
    ["Shop", "/shop"],
    [categoryLabel(p.category), `/shop/category/${p.category}`],
    ...(p.era ? ([[eraLabel(p.era), `/shop/era/${p.era}`]] as [string, string][]) : []),
    [p.title, `/shop/${p.slug}`],
  ];

  const courier = `${formatNzd(p.shipping_cents)} tracked courier`;
  const buyForm = (where: "main" | "bar") => (
    <form action="/api/checkout" method="post" className="buy-form">
      <input type="hidden" name="slug" value={p.slug} />
      {status === "available" ? (
        <>
          {site.pickup.enabled && where === "main" && (
            <fieldset className="delivery">
              <legend className="visually-hidden">Delivery</legend>
              <label className="delivery-opt">
                <input type="radio" name="delivery" value="courier" defaultChecked />
                <span>
                  <strong>Courier, NZ-wide</strong>
                  <small>{formatNzd(p.shipping_cents)}, tracked</small>
                </span>
              </label>
              <label className="delivery-opt">
                <input type="radio" name="delivery" value="pickup" />
                <span>
                  <strong>Pick up in {site.pickup.town}</strong>
                  <small>Free</small>
                </span>
              </label>
            </fieldset>
          )}
          {where === "bar" && <input type="hidden" name="delivery" value="courier" />}
          <button className="btn btn-buy" type="submit">
            Buy now
          </button>
        </>
      ) : (
        <button className="btn" type="button" disabled>
          {status === "sold" ? "Sold" : "On hold"}
        </button>
      )}
    </form>
  );

  return (
    <div className="wrap">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.title,
          description: p.description || [p.title, p.publisher, p.year].filter(Boolean).join(", "),
          image: p.images,
          url: `${site.url}/shop/${p.slug}`,
          category: ["Toys & Games > Games > Board Games", categoryLabel(p.category)].join(" > "),
          sku: `BG-${p.id}`,
          productID: `BG-${p.id}`,
          // The publisher is the brand of a board game; without one, the shop is named as the seller only.
          ...(p.publisher ? { brand: { "@type": "Brand", name: p.publisher } } : {}),
          ...(p.year ? { releaseDate: p.year } : {}),
          offers: {
            "@type": "Offer",
            price: (p.price_cents / 100).toFixed(2),
            priceCurrency: "NZD",
            availability: status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
            itemCondition: `https://schema.org/${condition?.schema ?? "UsedCondition"}`,
            url: `${site.url}/shop/${p.slug}`,
            seller: { "@type": "Organization", "@id": `${site.url}/#store`, name: site.name },
            shippingDetails: offerShipping(p.shipping_cents),
            hasMerchantReturnPolicy: returnPolicy(),
          },
        }}
      />

      <JsonLd data={breadcrumbs(crumbs)} />
      <nav className="crumbs" aria-label="Breadcrumb">
        {crumbs.slice(1, -1).map(([name, href], i) => (
          <span key={href}>
            {i > 0 && <span aria-hidden>/ </span>}
            <Link href={href}>{name}</Link>{" "}
          </span>
        ))}
      </nav>

      <article className="product">
        <Gallery images={p.images} blurs={p.blurs} title={productAlt(p)} />

        <div className="product-info">
          {unavailable && (
            <p className="notice" role="status">
              Someone else is checking out this game. If they don't finish, it will be available again within 30
              minutes.
            </p>
          )}
          {error && (
            <p className="notice" role="alert">
              Checkout couldn't be started. Please try again in a moment.
            </p>
          )}

          <h1>{p.title}</h1>
          {(p.publisher || p.year) && <p className="product-meta">{[p.publisher, p.year].filter(Boolean).join(", ")}</p>}

          <p className="product-price">
            <StatusPrice product={p} />
          </p>

          <div className="check-card">
            <CompleteLine product={p} />
            {complete && <p>{complete.note}</p>}
            {condition && (
              <p>
                <strong>{condition.label}.</strong> {condition.note}
              </p>
            )}
          </div>

          <p className="status-note">
            {status === "sold"
              ? "This one has found new players."
              : status === "reserved"
                ? "Someone is checking out. If they don't finish, it becomes available again."
                : site.pickup.enabled
                  ? `Plus ${courier}, or pick up free in ${site.pickup.town}.`
                  : `Plus ${courier}, NZ-wide.`}
          </p>

          <div className={`buy-inline${site.pickup.enabled ? " has-choice" : ""}`} id="buy">
            {buyForm("main")}
          </div>

          {p.description && <div className="product-desc">{p.description}</div>}

          <h2 className="details-head">Details</h2>
          <dl className="details">
            {p.players && (
              <div>
                <dt>Players</dt>
                <dd>{p.players}</dd>
              </div>
            )}
            {p.publisher && (
              <div>
                <dt>Publisher</dt>
                <dd>{p.publisher}</dd>
              </div>
            )}
            {p.year && (
              <div>
                <dt>Year</dt>
                <dd>{p.year}</dd>
              </div>
            )}
            {p.era && (
              <div>
                <dt>Decade</dt>
                <dd>
                  <Link href={`/shop/era/${p.era}`}>{eraLabel(p.era)}</Link>
                </dd>
              </div>
            )}
            <div>
              <dt>Category</dt>
              <dd>
                <Link href={`/shop/category/${p.category}`}>{categoryLabel(p.category)}</Link>
              </dd>
            </div>
            <div>
              <dt>Delivery</dt>
              <dd>
                {formatNzd(p.shipping_cents)}. {site.dispatchNote}
                {site.pickup.enabled && ` Or pick up in ${site.pickup.town} for free.`}{" "}
                <Link href="/shipping-and-returns">Delivery and returns</Link>
              </dd>
            </div>
          </dl>
        </div>
      </article>

      {related.length > 0 && (
        <section className="related" aria-labelledby="related">
          <div className="section-head">
            <h2 id="related">{relatedSameEra ? `More from the ${eraLabel(p.era)}` : "More games"}</h2>
            <Link href={relatedSameEra ? `/shop/era/${p.era}` : "/shop"}>See them all</Link>
          </div>
          <div className="grid">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}

      {status !== "sold" && (
        <>
          <div className="buy-bar-spacer" />
          <div className="buy-bar">
            <p className="price">
              {formatNzd(p.price_cents)}
              <small>{complete?.id === "complete" ? "Counted complete" : "One only"}</small>
            </p>
            {site.pickup.enabled && status === "available" ? (
              <a href="#buy" className="btn btn-buy">
                Buy now
              </a>
            ) : (
              buyForm("bar")
            )}
          </div>
        </>
      )}
    </div>
  );
}
