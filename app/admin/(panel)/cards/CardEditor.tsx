"use client";

import { useActionState } from "react";
import { CardStatsFields, type GameOption } from "@/components/listing/CardStatsFields";
import { saveCardStats, type CardEditState } from "../../actions";
import { site } from "@/site.config";

type Props = {
  cardNo: string;
  kind: "minted" | "index";
  game: string;
  gameNo: string;
  stats: Record<string, string | number>;
  listing?: { condition: string; completeness: string; era: string; rarity: string };
  blurb?: string;
};

const RARITIES = ["", "Common", "Uncommon", "Rare", "Vintage", "Sealed"];

/** Every stat on one card, editable by admin. Minted cards need a note, kept on the card's record. */
export function CardEditor({ cardNo, kind, game, gameNo, stats, listing, blurb }: Props) {
  const [state, action, saving] = useActionState<CardEditState, FormData>(saveCardStats, { error: "" });
  const none: GameOption[] = [];
  return (
    <form action={action} className="form card-editor">
      <input type="hidden" name="card_no" value={cardNo} />
      <CardStatsFields games={none} initial={stats} initialGame={game} initialGameNo={gameNo} lockGame={kind === "minted"} />

      {listing && (
        <div className="field-row three">
          <div className="field">
            <label htmlFor="condition">Condition</label>
            <select className="select" id="condition" name="condition" defaultValue={listing.condition}>
              {site.conditions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="completeness">Completeness</label>
            <select className="select" id="completeness" name="completeness" defaultValue={listing.completeness}>
              {site.completeness.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="era">Decade</label>
            <select className="select" id="era" name="era" defaultValue={listing.era}>
              <option value="">Not sure</option>
              {site.eras.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      {listing && (
        <div className="field">
          <label htmlFor="rarity">Rarity</label>
          <select className="select" id="rarity" name="rarity" defaultValue={listing.rarity}>
            {RARITIES.map((r) => (
              <option key={r} value={r}>
                {r || "Work it out from condition, completeness and decade"}
              </option>
            ))}
          </select>
        </div>
      )}
      {kind === "index" && (
        <div className="field">
          <label htmlFor="blurb">Card line</label>
          <input className="input" id="blurb" name="blurb" maxLength={200} defaultValue={blurb} />
        </div>
      )}
      {kind === "minted" && (
        <div className="field">
          <label htmlFor="note">Why are the stats changing?</label>
          <input className="input" id="note" name="note" placeholder="Seller entered 2-4 players; box says 2-6" required />
          <p className="hint">Kept on the card's record with today's date.</p>
        </div>
      )}

      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p className="notice" role="status">
          {state.saved}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-buy" type="submit" disabled={saving}>
          {saving ? "Saving" : `Save ${cardNo}`}
        </button>
      </div>
    </form>
  );
}
