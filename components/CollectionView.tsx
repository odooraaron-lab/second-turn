import type { ReactNode } from "react";
import Link from "next/link";
import { ProductCard } from "./ProductCard";
import { RevealGrid } from "./RevealGrid";
import { JsonLd } from "./JsonLd";
import { breadcrumbs } from "@/lib/seo";
import type { Product } from "@/lib/products";
import { site } from "@/site.config";

type Props = {
  title: string;
  intro?: string;
  path: string; // canonical path of this page
  crumbs: [string, string][];
  products: Product[];
  /** Which filter chip is active */
  active?: { era?: string; category?: string; price?: string };
  /** Shown between the filter chips and the listings, for example related guides */
  lead?: ReactNode;
  /** Heading above the listings; set it when there is something above them */
  productsHeading?: string;
};

export function CollectionView({ title, intro, path, crumbs, products, active = {}, lead, productsHeading }: Props) {
  const sold = products.filter((p) => p.status === "sold").length;
  const available = products.length - sold;

  return (
    <div className="wrap">
      <JsonLd data={breadcrumbs(crumbs)} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: title,
          description: intro,
          url: `${site.url}${path}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.slice(0, 30).map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${site.url}/shop/${p.slug}`,
              name: p.title,
            })),
          },
        }}
      />

      <header className="page-head">
        {crumbs.length > 2 && (
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.slice(1, -1).map(([name, href]) => (
              <span key={href}>
                <Link href={href}>{name}</Link>
                <span aria-hidden> / </span>
              </span>
            ))}
          </nav>
        )}
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
        <p className="count">
          {available} available{sold ? `, ${sold} sold` : ""}
        </p>
      </header>

      <nav className="chips" aria-label="Browse by type or decade">
        <Link href="/shop" className="chip" aria-current={!active.era && !active.category && !active.price ? "page" : undefined}>
          All
        </Link>
        {site.categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop/category/${c.id}`}
            className="chip"
            aria-current={active.category === c.id ? "page" : undefined}
          >
            {c.label}
          </Link>
        ))}
        <span className="chip-gap" aria-hidden />
        {site.eras.map((e) => (
          <Link key={e.id} href={`/shop/era/${e.id}`} className="chip" aria-current={active.era === e.id ? "page" : undefined}>
            {e.short}
          </Link>
        ))}
      </nav>

      {lead}

      {productsHeading && (
        <div className="section-head products-head">
          <h2>{productsHeading}</h2>
        </div>
      )}

      {products.length ? (
        <RevealGrid>
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} eager={i < 4} lcp={i === 0} />
          ))}
        </RevealGrid>
      ) : (
        <div className="empty">
          <p>Nothing here right now. New games are listed as they come in.</p>
          <p>
            <Link href="/shop">See every game for sale</Link>
          </p>
        </div>
      )}
    </div>
  );
}
