import Image from "next/image";
import Link from "next/link";
import { formatNzd } from "@/lib/format";
import { publicStatus, isNew, type Product } from "@/lib/products";
import { completenessOf, conditionOf } from "@/site.config";

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
 * A listing in a grid. `eager` loads the photo straight away (use for the first row);
 * the rest load as they scroll near, with a blurred preview showing first.
 */
export function ProductCard({ product, eager, lcp }: { product: Product; eager?: boolean; lcp?: boolean }) {
  const status = publicStatus(product);
  const cover = product.images[0];
  const blur = cover ? product.blurs?.[cover] : undefined;
  const meta = [product.publisher, product.year].filter(Boolean).join(", ");
  const condition = conditionOf(product.condition);

  return (
    <article className={`card${status === "sold" ? " is-sold" : ""}`}>
      <Link href={`/shop/${product.slug}`} className="card-link">
        <div className="tabletop">
          {cover ? (
            <Image
              src={cover}
              alt={productAlt(product)}
              fill
              sizes="(min-width: 1100px) 300px, (min-width: 720px) 33vw, 50vw"
              loading={eager ? "eager" : "lazy"}
              fetchPriority={lcp ? "high" : undefined}
              placeholder={blur ? "blur" : "empty"}
              blurDataURL={blur}
            />
          ) : (
            <span className="tabletop-empty">Photo coming</span>
          )}
          {/* The price sticker, like the ones on every op-shop game box. Read out from the label below. */}
          <span className={`sticker sticker-${status}`} aria-hidden>
            {status === "sold" ? "Sold" : formatNzd(product.price_cents)}
            {status === "reserved" && <small>on hold</small>}
          </span>
          {status === "available" && isNew(product) && <span className="new-tag">Just in</span>}
        </div>
        <div className="label">
          <span className="title">{product.title}</span>
          {meta && <span className="meta">{meta}</span>}
          <span className="card-checks">
            <CompleteLine product={product} />
            {condition && <span className="cond">{condition.label}</span>}
          </span>
          <span className="visually-hidden">
            <StatusPrice product={product} />
          </span>
        </div>
      </Link>
      {status === "available" && (
        <form action="/api/checkout" method="post" className="card-buy">
          <input type="hidden" name="slug" value={product.slug} />
          <input type="hidden" name="delivery" value="courier" />
          <button type="submit" className="btn btn-small btn-buy">
            Buy now
          </button>
        </form>
      )}
    </article>
  );
}
