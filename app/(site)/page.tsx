import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { RevealGrid } from "@/components/RevealGrid";
import { BoardHero } from "@/components/BoardHero";
import { listPublicProducts } from "@/lib/products";
import { sortedPosts } from "@/content/posts";
import { formatDate } from "@/lib/format";
import { PostCover } from "@/components/PostCover";
import { site } from "@/site.config";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Counted against the rules",
    text: "Every card, pawn, die and banknote is sorted and counted against the contents list for that edition.",
  },
  {
    title: "Photographed as it is",
    text: "Box front and back, everything laid out, and close-ups of any wear. Split corners and pen marks are shown, not hidden.",
  },
  {
    title: "Packed so nothing rattles",
    text: `Pieces bagged, cards banded, gaps filled. Then off by tracked courier${
      site.pickup.enabled ? `, or ready to collect in ${site.pickup.town}` : ""
    }.`,
  },
];

export default async function Home() {
  const all = await listPublicProducts().catch(() => []);
  const forSale = all.filter((p) => p.status !== "sold");
  const latest = all.slice(0, 8);
  const posts = sortedPosts().slice(0, 3);

  const count = (n: number) => (n ? `${n} for sale` : "Coming soon");
  const inCat = (id: string) => forSale.filter((p) => p.category === id).length;
  const inEra = (id: string) => forSale.filter((p) => p.era === id).length;

  // Nine squares in track order. Short labels so they fit a phone; the ids come from site.config.ts.
  const squares = [
    { href: "/shop", label: "Every game", note: count(forSale.length) },
    { href: "/shop/category/board-games", label: "Board games", note: count(inCat("board-games")) },
    { href: "/shop/category/card-games", label: "Card and dice", note: count(inCat("card-games")) },
    { href: "/shop/category/puzzles", label: "Jigsaws", note: count(inCat("puzzles")) },
    { href: "/shop/category/parts", label: "Spare parts", note: count(inCat("parts")) },
    { href: "/shop/era/1970s", label: "1970s", note: count(inEra("1970s")) },
    { href: "/shop/era/1980s", label: "1980s", note: count(inEra("1980s")) },
    { href: "/shop/era/1990s", label: "1990s", note: count(inEra("1990s")) },
    { href: "/blog", label: "The blog", note: "Stories and how-tos" },
  ];

  // One cover per decade, from its newest available game (sold games as a fallback).
  const eraTiles = site.eras.map((e) => {
    const inThis = all.filter((p) => p.era === e.id && p.images[0]);
    const cover = inThis.find((p) => p.status !== "sold") ?? inThis[0];
    return { ...e, cover: cover?.images[0], count: inThis.filter((p) => p.status !== "sold").length };
  });

  return (
    <>
      <section className="hero">
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <h1>Old games, counted and ready to play.</h1>
            <p>
              Second-hand board games, card games and jigsaws from the 60s to now. Every piece checked against the rules,
              then couriered NZ-wide{site.pickup.enabled ? ` or picked up in ${site.pickup.town}` : ""}.
            </p>
            <div className="hero-actions">
              <Link href="/shop" className="btn btn-buy">
                Shop every game
              </Link>
              <Link href="/about#how-we-check" className="btn btn-quiet">
                How games are checked
              </Link>
            </div>
          </div>
          <BoardHero squares={squares} />
        </div>
      </section>

      <section className="wrap section-tight" aria-labelledby="new-in">
        <div className="section-head">
          <h2 id="new-in">Just listed</h2>
          <Link href="/shop">See every game</Link>
        </div>
        {latest.length ? (
          <RevealGrid>
            {latest.map((p, i) => (
              <ProductCard key={p.id} product={p} eager={i < 4} lcp={i === 0} />
            ))}
          </RevealGrid>
        ) : (
          <p className="empty">The first games are being counted and photographed. Check back soon.</p>
        )}
      </section>

      <section className="wrap section" aria-labelledby="checked">
        <div className="checked">
          <div className="checked-head">
            <h2 id="checked">How every game is checked</h2>
            <p>Second-hand games are only fun if they're all there. So each one goes through the same three steps.</p>
          </div>
          <ol className="checked-steps">
            {steps.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
          <p className="checked-foot">
            Labelled <strong>Counted complete</strong>, <strong>Missing pieces</strong> or <strong>Not counted</strong>,
            so you always know. <Link href="/blog/reading-second-hand-board-game-listings">What the labels mean</Link>
          </p>
        </div>
      </section>

      <section className="band band-tint" aria-labelledby="blog">
        <div className="wrap">
          <div className="section-head">
            <h2 id="blog">From the games cupboard</h2>
            <Link href="/blog">All posts</Link>
          </div>
          <ul className="post-list post-list-row">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link href={`/blog/${post.slug}`}>
                  <PostCover post={post} variant="wide" />
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  <h3>{post.title}</h3>
                  <p>{post.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap section" aria-labelledby="decades">
        <div className="section-head">
          <h2 id="decades">Browse by decade</h2>
          <Link href="/shop">Shop all</Link>
        </div>
        <RevealGrid className="era-tiles">
          {eraTiles.map((e) => (
            <Link key={e.id} href={`/shop/era/${e.id}`} className="era-tile card">
              <span className="era-lid">
                {e.cover ? (
                  <Image src={e.cover} alt="" fill sizes="(min-width: 1100px) 220px, (min-width: 720px) 30vw, 45vw" />
                ) : (
                  <span className={`era-swatch swatch-${e.id}`} aria-hidden />
                )}
              </span>
              <span className="era-name">{e.label}</span>
              <span className="era-count">{e.count ? `${e.count} for sale` : "Coming soon"}</span>
            </Link>
          ))}
        </RevealGrid>
      </section>
    </>
  );
}
