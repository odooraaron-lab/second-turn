import { CollectorCard } from "./CollectorCard";
import { formatNzd } from "@/lib/format";
import { publicStatus, type Product } from "@/lib/products";
import { completenessOf } from "@/site.config";

/** "Waddingtons, 1972" style summary line */
export const productMeta = (p: Pick<Product, "publisher" | "year" | "players">) =>
  [p.publisher, p.year, p.players].filter(Boolean).join(", ");

/** Alt text that says what the photo shows, for screen readers and Google Images */
export const productAlt = (p: Pick<Product, "title" | "publisher" | "year">) =>
  [`${p.title} board game`, [p.publisher, p.year].filter(Boolean).join(" ")].filter(Boolean).join(", ");

/** Every game shows its price; sold and held games say so alongside it. */
export function StatusPrice({ product }: { product: Product }) {
  const status = publicStatus(product);
  const price = formatNzd(product.price_cents);
  if (status === "sold")
    return (
      <>
        <span className="sold-mark">Sold</span> <span className="was">{price}</span>
      </>
    );
  if (status === "reserved")
    return (
      <>
        <span className="hold-dot" aria-hidden /> {price}, on hold
      </>
    );
  return <>{price}</>;
}

/** The small "counted complete" / "missing pieces" line, the first thing second-hand buyers look for. */
export function CompleteLine({ product }: { product: Pick<Product, "completeness"> }) {
  const c = completenessOf(product.completeness);
  if (!c) return null;
  return (
    <span className={`complete complete-${c.id}`}>
      <span className="complete-icon" aria-hidden />
      {c.label}
    </span>
  );
}

/**
 * A listing in a grid, drawn as a collector card (components/CollectorCard.tsx).
 * `eager` loads the photo straight away (use for the first row).
 */
export function ProductCard({ product, eager, lcp }: { product: Product; eager?: boolean; lcp?: boolean }) {
  const status = publicStatus(product);
  return (
    <CollectorCard product={product} eager={eager} lcp={lcp} href={`/shop/${product.slug}`}>
      {status === "available" && (
        <form action="/api/checkout" method="post" className="card-buy">
          <input type="hidden" name="slug" value={product.slug} />
          <input type="hidden" name="delivery" value="courier" />
          <button type="submit" className="btn btn-small btn-buy">
            Buy now
          </button>
        </form>
      )}
    </CollectorCard>
  );
}
