import Link from "next/link";

export type Square = { href: string; label: string; note?: string };

/**
 * The home page's game board: a winding 3 × 3 track, numbered like snakes and ladders from the bottom left.
 * Every square is a link. Pointing at or tabbing to a square moves the pawn there (pure CSS, see .board in globals.css).
 */
export function BoardHero({ squares }: { squares: Square[] }) {
  return (
    <nav className="board-wrap" aria-label="Start browsing">
      <ol className="board">
        {squares.slice(0, 9).map((s, i) => (
          <li key={s.href} className={`sq sq-${i + 1}`}>
            <Link href={s.href}>
              <span className="sq-num" aria-hidden>
                {i + 1}
              </span>
              <span className="sq-label">{s.label}</span>
              {s.note && <span className="sq-note">{s.note}</span>}
            </Link>
          </li>
        ))}
      </ol>
      <svg className="board-path" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden>
        <polyline points="50,250 250,250 250,150 50,150 50,50 250,50" />
      </svg>
      <span className="pawn" aria-hidden>
        <svg viewBox="0 0 40 56">
          <ellipse cx="20" cy="51" rx="16" ry="5" className="pawn-shadow" />
          <path d="M20 4a9 9 0 0 1 5.6 16c3 2.6 4.6 7 5.4 13.5l4 12.5a3 3 0 0 1-2.9 3.9H7.9A3 3 0 0 1 5 46l4-12.5C9.8 27 11.4 22.6 14.4 20A9 9 0 0 1 20 4Z" />
          <ellipse cx="16.5" cy="11" rx="2.6" ry="3.2" className="pawn-shine" />
        </svg>
      </span>
    </nav>
  );
}
