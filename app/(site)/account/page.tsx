import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/users";
import { sql } from "@/lib/db";
import type { Product } from "@/lib/products";
import { CollectorCard } from "@/components/CollectorCard";
import { viewFromProduct } from "@/lib/card-view";
import { logout, withdrawListing } from "./actions";

export const metadata: Metadata = { title: "My cards", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ minted?: string; welcome?: string }> };

const STATUS: Record<string, string> = {
  pending: "Waiting for review",
  approved: "In the shop",
  rejected: "Not accepted. We'll have emailed you why.",
};

export default async function Account({ searchParams }: Props) {
  const user = await requireUser();
  const { minted, welcome } = await searchParams;
  const mine = (await sql()`SELECT * FROM bg_products WHERE seller_id = ${user.id} ORDER BY created_at DESC`) as Product[];

  return (
    <div className="wrap">
      <header className="page-head account-head">
        <h1>My cards</h1>
        <p>
          @{user.username} · {mine.length} {mine.length === 1 ? "card" : "cards"} minted
        </p>
        <div className="hero-actions">
          <Link href="/account/list" className="btn btn-buy">
            List a game
          </Link>
          <form action={logout}>
            <button className="btn btn-quiet" type="submit">
              Log out
            </button>
          </form>
        </div>
      </header>

      {welcome && (
        <p className="notice" role="status">
          Welcome! Your account is ready. List your first game to mint your first card.
        </p>
      )}
      {minted && (
        <p className="notice" role="status">
          Minted card {minted}. We'll check it over and put it in the shop, usually within a day.
        </p>
      )}

      {mine.length ? (
        <div className="grid">
          {mine.map((p) => (
            <CollectorCard key={p.id} view={viewFromProduct(p)} href={p.review === "approved" && p.visible ? `/shop/${p.slug}` : undefined}>
              <p className="pc-status">{p.status === "sold" ? "Sold. We'll be in touch about payment." : STATUS[p.review] ?? ""}</p>
              {p.review === "pending" && (
                <form action={withdrawListing}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="btn btn-small btn-quiet" type="submit">
                    Withdraw
                  </button>
                </form>
              )}
            </CollectorCard>
          ))}
        </div>
      ) : (
        <p className="empty">No cards yet. List a game and it becomes card number one in your collection.</p>
      )}

      <section className="section prose">
        <h2>How selling works</h2>
        <p>
          You list the game and set your price. We check the listing, then it goes in the shop with its card. When it
          sells, we email you to arrange getting the game to the buyer and paying you. See the{" "}
          <Link href="/terms#selling">terms for sellers</Link>.
        </p>
      </section>
    </div>
  );
}
