import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getGame, getProductByCardNo, statsOf, listGames } from "@/lib/cards";
import { listAllProducts } from "@/lib/products";
import { CardEditor } from "./CardEditor";
import { CollectorCard } from "@/components/CollectorCard";
import { viewFromGame, viewFromProduct } from "@/lib/card-view";

export const metadata = { title: "Cards" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ no?: string }> };

export default async function Cards({ searchParams }: Props) {
  await requireAdmin();
  const no = ((await searchParams).no ?? "").trim().toUpperCase();
  const product = no && !no.startsWith("G-") ? await getProductByCardNo(no) : null;
  const game = no.startsWith("G-") ? await getGame(no) : null;

  const finder = (
    <form method="get" className="card-finder">
      <label htmlFor="no">Card number</label>
      <div className="field-row">
        <input className="input" id="no" name="no" placeholder="ST-00012 or G-0003" defaultValue={no} autoCapitalize="characters" />
        <button className="btn" type="submit">
          Open card
        </button>
      </div>
      <p className="hint">ST- cards are listings (minted, locked for sellers). G- cards are the Game Index that new listings start from.</p>
    </form>
  );

  if (!no || (!product && !game)) {
    const [recent, games] = await Promise.all([listAllProducts(), listGames()]);
    return (
      <>
        <div className="admin-title">
          <h1>Cards</h1>
        </div>
        {finder}
        {no && (
          <p className="form-error" role="alert">
            No card {no}.
          </p>
        )}
        <h2 className="admin-sub">Latest minted cards</h2>
        <ul className="card-index">
          {recent
            .filter((p) => p.card_no)
            .slice(0, 30)
            .map((p) => (
              <li key={p.id}>
                <Link href={`/admin/cards?no=${p.card_no}`}>
                  <b>{p.card_no}</b> {p.title}
                </Link>
              </li>
            ))}
        </ul>
        <h2 className="admin-sub">Game Index ({games.length})</h2>
        <ul className="card-index">
          {games.map((g) => (
            <li key={g.game_no}>
              <Link href={`/admin/cards?no=${g.game_no}`}>
                <b>{g.game_no}</b> {g.name}
              </Link>
            </li>
          ))}
        </ul>
      </>
    );
  }

  if (product) {
    const s = statsOf(product);
    return (
      <>
        <div className="admin-title">
          <h1>Card {product.card_no}</h1>
          <p className="hint">
            {product.title}. Minted {product.minted_at ? new Date(product.minted_at).toLocaleDateString("en-NZ") : "—"}
            {product.card_edited_at
              ? `, last changed ${new Date(product.card_edited_at).toLocaleDateString("en-NZ")}: “${product.card_edit_note}”`
              : ""}
            . <Link href={`/admin/listings/${product.id}`}>Edit the listing</Link>
          </p>
        </div>
        {finder}
        <div className="card-editor-layout">
          <div className="card-editor-preview">
            <CollectorCard view={viewFromProduct(product)} />
          </div>
          <CardEditor
            cardNo={product.card_no}
            kind="minted"
            game={s.game}
            gameNo={s.gameNo}
            stats={{
              year: s.year,
              designer: s.designer,
              publisher: s.publisher,
              min_players: s.minPlayers,
              max_players: s.maxPlayers,
              play_minutes: s.playMinutes,
              min_age: s.minAge,
              kind: s.kind,
              mechanics: s.mechanics,
              edition: s.edition,
              strategy: s.strategy,
              luck: s.luck,
              social: s.social,
              speed: s.speed,
            }}
            listing={{ condition: s.condition, completeness: s.completeness, era: s.era, rarity: s.rarity }}
          />
        </div>
      </>
    );
  }

  const g = game!;
  return (
    <>
      <div className="admin-title">
        <h1>Game Index {g.game_no}</h1>
        <p className="hint">
          {g.name}. New listings of this game start from these stats; cards already minted keep their own.
        </p>
      </div>
      {finder}
      <div className="card-editor-layout">
        <div className="card-editor-preview">
          <CollectorCard view={viewFromGame(g)} />
        </div>
        <CardEditor
          cardNo={g.game_no}
          kind="index"
          game={g.name}
          gameNo={g.game_no}
          blurb={g.blurb}
          stats={{
            year: g.year,
            designer: g.designer,
            publisher: g.publisher,
            min_players: g.min_players,
            max_players: g.max_players,
            play_minutes: g.play_minutes,
            min_age: g.min_age,
            kind: g.kind,
            mechanics: g.mechanics,
            strategy: g.strategy,
            luck: g.luck,
            social: g.social,
            speed: g.speed,
          }}
        />
      </div>
    </>
  );
}
