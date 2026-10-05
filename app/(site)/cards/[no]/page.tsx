import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CollectorCard } from "@/components/CollectorCard";
import { JsonLd } from "@/components/JsonLd";
import { getGame, getProductByCardNo, statsOf } from "@/lib/cards";
import { viewFromGame, viewFromProduct, type CardView } from "@/lib/card-view";
import { sql } from "@/lib/db";
import type { Product } from "@/lib/products";
import { breadcrumbs } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { site } from "@/site.config";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ no: string }> };

async function load(raw: string) {
  const no = decodeURIComponent(raw).toUpperCase();
  if (no.startsWith("G-")) {
    const game = await getGame(no);
    return game ? { game, product: null } : null;
  }
  const product = await getProductByCardNo(no);
  return product && product.visible ? { game: null, product } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load((await params).no);
  if (!found) return { title: "Card not found" };
  const v = found.game ? viewFromGame(found.game) : viewFromProduct(found.product!);
  const title = `${v.title} card ${v.no}: players, time and stats`;
  return {
    title,
    description: `${v.title}${v.sub ? ` (${v.sub})` : ""}: ${v.players} players, ${v.minutes}, ages ${v.age}. ${v.kind}. Strategy ${v.power.strategy}, luck ${v.power.luck}, social ${v.power.social}, speed ${v.power.speed} out of 10.`,
    alternates: { canonical: `/cards/${v.no}` },
  };
}

function StatTable({ v, extra }: { v: CardView; extra: [string, string][] }) {
  const rows: [string, string][] = [
    ["Card number", v.no],
    ["Rarity", v.rarity],
    ["Players", v.players],
    ["Playing time", v.minutes],
    ["Ages", v.age],
    ["Type", v.kind],
    ["How it plays", v.mechanics],
    ["Designer", v.designer],
    ["Year and publisher", v.sub],
    ["Strategy", `${v.power.strategy} / 10`],
    ["Luck", `${v.power.luck} / 10`],
    ["Social", `${v.power.social} / 10`],
    ["Speed", `${v.power.speed} / 10`],
    ...extra,
  ];
  return (
    <dl className="details card-stats">
      {rows
        .filter(([, value]) => value)
        .map(([k, value]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}

export default async function CardPage({ params }: Props) {
  const found = await load((await params).no);
  if (!found) notFound();

  if (found.product) {
    const p = found.product;
    const v = viewFromProduct(p);
    const s = statsOf(p);
    return (
      <div className="wrap">
        <JsonLd data={breadcrumbs([["Home", "/"], ["Player cards", "/cards"], [v.no, `/cards/${v.no}`]])} />
        <header className="page-head">
          <h1>
            {v.title} <span className="muted">{v.no}</span>
          </h1>
          <p>
            Minted {p.minted_at ? formatDate(p.minted_at) : ""}. Stats locked
            {p.card_edited_at ? `; corrected by the shop on ${formatDate(p.card_edited_at)}` : ""}.
          </p>
        </header>
        <div className="card-page">
          <CollectorCard view={v} />
          <div>
            <StatTable
              v={v}
              extra={[
                ["Edition", s.edition],
                ["Completeness", v.completeness?.label ?? ""],
                ["Condition", v.condition?.label ?? ""],
                ["Game Index", s.gameNo],
              ]}
            />
            <div className="hero-actions">
              <Link href={`/shop/${p.slug}`} className="btn btn-buy">
                {v.status === "sold" ? "See the listing" : `Buy now, ${v.price}`}
              </Link>
              {s.gameNo && (
                <Link href={`/cards/${s.gameNo}`} className="btn btn-quiet">
                  Game Index card
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const g = found.game!;
  const v = viewFromGame(g);
  const copies = (await sql()`SELECT * FROM bg_products WHERE visible AND card->>'gameNo' = ${g.game_no}
                              ORDER BY (status = 'sold'), minted_at DESC`.catch(() => [])) as Product[];
  return (
    <div className="wrap">
      <JsonLd data={breadcrumbs([["Home", "/"], ["Player cards", "/cards?show=index"], [g.name, `/cards/${g.game_no}`]])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Game",
          name: g.name,
          ...(g.designer && !/^traditional|unknown/i.test(g.designer) ? { author: g.designer.split(",").map((n) => ({ "@type": "Person", name: n.trim() })) } : {}),
          ...(g.publisher && g.publisher !== "Various" ? { publisher: { "@type": "Organization", name: g.publisher } } : {}),
          ...(/^\d{4}$/.test(g.year) ? { datePublished: g.year } : {}),
          numberOfPlayers: { "@type": "QuantitativeValue", minValue: g.min_players, maxValue: g.max_players },
          typicalAgeRange: `${g.min_age}-`,
          url: `${site.url}/cards/${g.game_no}`,
        }}
      />
      <header className="page-head">
        <h1>
          {g.name} <span className="muted">{g.game_no}</span>
        </h1>
        <p>{g.blurb}</p>
      </header>
      <div className="card-page">
        <CollectorCard view={v} />
        <div>
          <StatTable v={v} extra={[]} />
          <div className="hero-actions">
            <Link href={`/account/list`} className="btn btn-buy">
              Have one? List it
            </Link>
            <Link href={`/shop`} className="btn btn-quiet">
              Shop all games
            </Link>
          </div>
        </div>
      </div>
      {copies.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Minted copies of {g.name}</h2>
          </div>
          <div className="grid">
            {copies.map((p) => (
              <CollectorCard key={p.id} view={viewFromProduct(p)} href={`/shop/${p.slug}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
