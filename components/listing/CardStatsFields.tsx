"use client";

import { useMemo, useState } from "react";
import { KINDS_LIST, POWER_LIST } from "./card-options";

export type GameOption = {
  game_no: string;
  name: string;
  year: string;
  designer: string;
  publisher: string;
  min_players: number;
  max_players: number;
  play_minutes: number;
  min_age: number;
  kind: string;
  mechanics: string;
  strategy: number;
  luck: number;
  social: number;
  speed: number;
};

type Stats = Omit<GameOption, "game_no" | "name"> & { edition: string };

const blank: Stats = {
  year: "",
  designer: "",
  publisher: "",
  min_players: 2,
  max_players: 4,
  play_minutes: 30,
  min_age: 8,
  kind: "Family",
  mechanics: "",
  strategy: 5,
  luck: 5,
  social: 5,
  speed: 5,
  edition: "",
};

/**
 * Card stats for a new listing. Pick the game from the Game Index to fill everything in,
 * then adjust anything that's different about this copy. Also used by the admin card editor.
 */
export function CardStatsFields({
  games,
  initial,
  initialGame,
  initialGameNo,
  lockGame,
}: {
  games: GameOption[];
  initial?: Partial<Stats>;
  initialGame?: string;
  initialGameNo?: string;
  /** In the card editor the Game Index link can't change */
  lockGame?: boolean;
}) {
  const [gameName, setGameName] = useState(initialGame ?? "");
  const [gameNo, setGameNo] = useState(initialGameNo ?? "");
  const [s, setS] = useState<Stats>({ ...blank, ...initial });
  const byName = useMemo(() => new Map(games.map((g) => [g.name.toLowerCase(), g])), [games]);

  function chooseGame(name: string) {
    setGameName(name);
    const g = byName.get(name.trim().toLowerCase());
    if (g && !lockGame) {
      setGameNo(g.game_no);
      const { game_no: _n, name: _m, ...stats } = g;
      setS((prev) => ({ ...prev, ...stats }));
    } else if (!lockGame) {
      setGameNo("");
    }
  }
  const set = <K extends keyof Stats>(k: K, v: Stats[K]) => setS((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="card-fields">
      <input type="hidden" name="game_no" value={gameNo} />
      <div className="field">
        <label htmlFor="game_name">Which game is it?</label>
        <input
          className="input"
          id="game_name"
          name="game_name"
          list="game-index"
          autoComplete="off"
          placeholder="Start typing: Cluedo, Monopoly, Catan…"
          value={gameName}
          onChange={(e) => chooseGame(e.target.value)}
          readOnly={lockGame}
        />
        <datalist id="game-index">
          {games.map((g) => (
            <option key={g.game_no} value={g.name}>
              {g.game_no}
            </option>
          ))}
        </datalist>
        <p className="hint">
          {gameNo
            ? `Matched Game Index card ${gameNo}. Its stats are filled in below; change anything that's different about this copy.`
            : "Not in the Game Index yet? Fill in the stats below and it'll be added for next time. The box and rules have most of them."}
        </p>
      </div>

      <div className="field-row three">
        <div className="field">
          <label htmlFor="min_players">Min players</label>
          <input className="input" id="min_players" name="min_players" type="number" min={1} max={99} value={s.min_players} onChange={(e) => set("min_players", Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="max_players">Max players</label>
          <input className="input" id="max_players" name="max_players" type="number" min={1} max={99} value={s.max_players} onChange={(e) => set("max_players", Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="play_minutes">Minutes</label>
          <input className="input" id="play_minutes" name="play_minutes" type="number" min={1} max={1440} value={s.play_minutes} onChange={(e) => set("play_minutes", Number(e.target.value))} />
        </div>
      </div>
      <div className="field-row three">
        <div className="field">
          <label htmlFor="min_age">Age from</label>
          <input className="input" id="min_age" name="min_age" type="number" min={0} max={21} value={s.min_age} onChange={(e) => set("min_age", Number(e.target.value))} />
        </div>
        <div className="field">
          <label htmlFor="year">Year</label>
          <input className="input" id="year" name="year" inputMode="numeric" placeholder="1986" value={s.year} onChange={(e) => set("year", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="kind">Type</label>
          <select className="select" id="kind" name="kind" value={s.kind} onChange={(e) => set("kind", e.target.value)}>
            {KINDS_LIST.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label htmlFor="designer">Designer</label>
          <input className="input" id="designer" name="designer" placeholder="Anthony E. Pratt" value={s.designer} onChange={(e) => set("designer", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="publisher">Publisher</label>
          <input className="input" id="publisher" name="publisher" placeholder="Waddingtons" value={s.publisher} onChange={(e) => set("publisher", e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label htmlFor="mechanics">How it plays</label>
        <input className="input" id="mechanics" name="mechanics" placeholder="Deduction, roll and move" value={s.mechanics} onChange={(e) => set("mechanics", e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="edition">
          This edition <span className="optional">(optional)</span>
        </label>
        <input className="input" id="edition" name="edition" placeholder="1986 NZ printing, metal tokens" value={s.edition} onChange={(e) => set("edition", e.target.value)} />
      </div>

      <fieldset className="power-fields">
        <legend>Card power, out of 10</legend>
        {POWER_LIST.map((p) => (
          <label key={p.key} className="power-field">
            <span className="power-head">
              <b>{p.label}</b>
              <output>{s[p.key]}</output>
            </span>
            <input type="range" name={p.key} min={1} max={10} value={s[p.key]} onChange={(e) => set(p.key, Number(e.target.value))} />
            <small>{p.hint}</small>
          </label>
        ))}
      </fieldset>
    </div>
  );
}
