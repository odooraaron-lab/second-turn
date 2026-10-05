import type { Metadata } from "next";
import Link from "next/link";
import { CollectorCard } from "@/components/CollectorCard";
import { JsonLd } from "@/components/JsonLd";
import { listMintedCards, listGames } from "@/lib/cards";
import { publicStatus } from "@/lib/products";
import { viewFromGame, viewFromProduct } from "@/lib/card-view";
import { breadcrumbs, shareImage } from "@/lib/seo";
import { site } from "@/site.config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Player cards: every board game card, with stats",
  description: `Every board game listed on ${site.name} is minted as a numbered collector card with players, time, age and power stats. Browse cards for sale, sold cards and the Game Index.`,
  alternates: { canonical: "/cards" },
  openGraph: { title: `Player cards | ${site.name}`, url: "/cards", images: [shareImage] },
};

type Props = { searchParams: Promise<{ show?: string; q?: string }> };

const TABS = [
  { id: "sale", label: "For sale" },
  { id: "sold", label: "Sold" },
  { id: "index", label: "Game Index" },
];

export default async function Cards({ searchParams }: Props) {
  const { show = "sale", q = "" } = await searchParams;
  const term = q.trim().toLowerCase();
  const [minted, games] = await Promise.all([listMintedCards().catch(() => []), listGames().catch(() => [])]);
  const forSale = minted.filter((p) => publicStatus(p) !== "sold");
  const sold = minted.filter((p) => publicStatus(p) === "sold");
  const counts: Record<string, number> = { sale: forSale.length, sold: sold.length, index: games.length };
  const tab = TABS.some((t) => t.id === show) ? show : "sale";
  const match = (s: string) => !term || s.toLowerCase().includes(term);

  const cards =
    tab === "index"
      ? games.filter((g) => match(`${g.name} ${g.game_no} ${g.designer} ${g.kind}`)).map((g) => ({ key: g.game_no, view: viewFromGame(g), href: `/cards/${g.game_no}`, product: null }))
      : (tab === "sold" ? sold : forSale)
          .filter((p) => match(`${p.title} ${p.card_no}`))
          .map((p) => ({ key: p.card_no, view: viewFromProduct(p), href: `/shop/${p.slug}`, product: p }));

  return (
    <div className="wrap">
      <JsonLd
        data={breadcrumbs([
          ["Home", "/"],
          ["Player cards", "/cards"],
        ])}
      />
      <header className="page-head">
        <h1>Player cards</h1>
        <p>
          Every game listed here is minted as a numbered collector card, its stats locked for good. Collect them, buy them,
          or <Link href="/account/signup">list your own</Link>.
        </p>
      </header>

      <nav className="chips" aria-label="Show cards">
        {TABS.map((t) => (
          <Link key={t.id} href={`/cards?show=${t.id}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="chip" aria-current={tab === t.id ? "page" : undefined}>
            {t.label} {counts[t.id]}
          </Link>
        ))}
      </nav>
      <form method="get" className="card-search" role="search">
        <input type="hidden" name="show" value={tab} />
        <label className="visually-hidden" htmlFor="q">
          Search cards
        </label>
        <input className="input" id="q" name="q" placeholder="Search by game or card number" defaultValue={q} />
        <button className="btn" type="submit">
          Search
        </button>
      </form>

      {tab === "index" && (
        <p className="hint index-note">
          The Game Index is the reference card for each title: the facts from the box and our power ratings. Listings start
          from these stats when they're minted.
        </p>
      )}

      {cards.length ? (
        <div className="grid">
          {cards.map((c, i) => (
            <CollectorCard key={c.key} view={c.view} href={c.href} eager={i < 3}>
              {c.product && c.view.status === "available" && (
                <form action="/api/checkout" method="post" className="card-buy">
                  <input type="hidden" name="slug" value={c.product.slug} />
                  <input type="hidden" name="delivery" value="courier" />
                  <button type="submit" className="btn btn-small btn-buy">
                    Buy now
                  </button>
                </form>
              )}
            </CollectorCard>
          ))}
        </div>
      ) : (
        <p className="empty">
          {tab === "sale" ? "No cards for sale right now. " : "Nothing here yet. "}
          <Link href="/cards?show=index">Browse the Game Index</Link>
        </p>
      )}
    </div>
  );
}
