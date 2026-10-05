import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listAllProducts, publicStatus, type Product } from "@/lib/products";
import { formatNzd } from "@/lib/format";
import { reviewListing } from "../actions";
import { sql } from "@/lib/db";

type Props = { searchParams: Promise<{ f?: string; saved?: string; deleted?: string; stripe?: string; minted?: string }> };

const filters = [
  { id: "all", label: "All" },
  { id: "pending", label: "To review" },
  { id: "available", label: "For sale" },
  { id: "sold", label: "Sold" },
  { id: "hidden", label: "Hidden" },
];

const matches = (p: Product, f: string) =>
  f === "pending"
    ? p.review === "pending"
    : f === "hidden" ? !p.visible : f === "sold" ? p.status === "sold" : f === "available" ? p.status !== "sold" && p.visible : true;

function State({ p }: { p: Product }) {
  if (p.review === "pending") return <span className="state state-pending">To review</span>;
  if (p.review === "rejected") return <span className="state state-hidden">Declined</span>;
  if (!p.visible) return <span className="state state-hidden">Hidden</span>;
  const status = publicStatus(p);
  if (status === "sold")
    return (
      <span className="state">
        <span className="red-dot" aria-hidden /> Sold
      </span>
    );
  if (status === "reserved")
    return (
      <span className="state">
        <span className="hold-dot" aria-hidden /> In checkout
      </span>
    );
  return <span className="state">For sale</span>;
}

export default async function Listings({ searchParams }: Props) {
  await requireAdmin();
  const { f = "all", saved, deleted, stripe, minted } = await searchParams;
  const all = await listAllProducts();
  const shown = all.filter((p) => matches(p, f));
  const pending = all.filter((p) => p.review === "pending");
  const sellerIds = [...new Set(pending.map((p) => p.seller_id).filter(Boolean))] as number[];
  const sellers = sellerIds.length
    ? new Map(((await sql()`SELECT id, username, email FROM bg_users WHERE id = ANY(${sellerIds})`) as { id: number; username: string; email: string }[]).map((u) => [u.id, u]))
    : new Map();

  return (
    <>
      {saved && (
        <p className="notice" role="status">
          Saved “{saved}”.{minted ? ` Minted as card ${minted}.` : ""}
        </p>
      )}
      {pending.length > 0 && (
        <section className="review-box" aria-labelledby="review-title">
          <h2 id="review-title">Player listings to review ({pending.length})</h2>
          <p className="hint">
            Approve to put the game in the shop. Check the photos, price and card stats first, and arrange with the
            player how the game gets to the buyer.
          </p>
          <ul className="row-list">
            {pending.map((p) => {
              const seller = p.seller_id ? sellers.get(p.seller_id) : null;
              return (
                <li key={p.id} className="review-row">
                  <Link href={`/admin/listings/${p.id}`} className="row">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="row-thumb" src={p.images[0]} alt="" />
                    ) : (
                      <span className="row-thumb" />
                    )}
                    <span className="row-text">
                      <span className="title">{p.title}</span>
                      <span className="sub">
                        {p.card_no} · {formatNzd(p.price_cents)} · from {seller ? `@${seller.username} (${seller.email})` : "a player"}
                      </span>
                    </span>
                  </Link>
                  <form action={reviewListing} className="review-actions">
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn btn-small btn-buy" name="decision" value="approve">
                      Approve
                    </button>
                    <button className="btn btn-small btn-quiet" name="decision" value="reject">
                      Decline
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {stripe === "failed" && (
        <p className="notice" role="alert">
          Saved, but Stripe couldn't be updated just now. The game can still be bought. Open Setup to sync it.
        </p>
      )}
      {deleted && (
        <p className="notice" role="status">
          Listing deleted.
        </p>
      )}

      <Link href="/admin/listings/new" className="btn btn-block">
        List a game
      </Link>

      <nav className="tabs" aria-label="Filter listings">
        {filters.map((x) => (
          <Link
            key={x.id}
            href={x.id === "all" ? "/admin" : `/admin?f=${x.id}`}
            className="chip"
            aria-current={f === x.id ? "page" : undefined}
          >
            {x.label} {all.filter((p) => matches(p, x.id)).length}
          </Link>
        ))}
      </nav>

      {shown.length ? (
        <ul className="row-list">
          {shown.map((p) => (
            <li key={p.id}>
              <Link href={`/admin/listings/${p.id}`} className="row" aria-label={`Edit ${p.title}`}>
                {p.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="row-thumb" src={p.images[0]} alt="" />
                ) : (
                  <span className="row-thumb" />
                )}
                <span className="row-text">
                  <span className="title">{p.title}</span>
                  <span className="sub">
                    {p.card_no && <span className="card-no-tag">{p.card_no}</span>}
                    {formatNzd(p.price_cents)}
                    <State p={p} />
                  </span>
                </span>
                <span className="chev" aria-hidden>
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">
          {all.length ? "Nothing in this view." : "No games yet. Tap List a game to photograph your first one."}
        </p>
      )}

      <p style={{ marginTop: 24 }}>
        <Link href="/" target="_blank" className="muted">
          Open the shop in a new tab
        </Link>
      </p>
    </>
  );
}
