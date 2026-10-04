import Link from "next/link";
import type { ReactNode } from "react";

// Tiny renderer for the blog posts: "## heading", "- list item", blank-line paragraphs,
// **bold**, *italic* and [links](/shop).
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${i++}`;
    if (m[1]) {
      out.push(
        m[2].startsWith("/") ? <Link key={k} href={m[2]}>{m[1]}</Link> : <a key={k} href={m[2]} rel="noopener">{m[1]}</a>
      );
    } else if (m[3]) out.push(<strong key={k}>{m[3]}</strong>);
    else if (m[4]) out.push(<em key={k}>{m[4]}</em>);
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** The "## " headings of a post, for its contents list. */
export const headings = (source: string) =>
  source
    .split("\n")
    .filter((l) => l.startsWith("## "))
    .map((l) => ({ text: l.slice(3).trim(), id: headingId(l.slice(3).trim()) }));

export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n\s*\n/);
  return (
    <>
      {blocks.map((block, b) => {
        const lines = block.trim().split("\n");
        if (lines[0].startsWith("## "))
          return (
            <h2 key={b} id={headingId(lines[0].slice(3).trim())}>
              {inline(lines[0].slice(3), `h${b}`)}
            </h2>
          );
        if (lines.every((l) => l.startsWith("- ")))
          return (
            <ul key={b}>
              {lines.map((l, i) => <li key={i}>{inline(l.slice(2), `l${b}-${i}`)}</li>)}
            </ul>
          );
        return <p key={b}>{inline(lines.join(" "), `p${b}`)}</p>;
      })}
    </>
  );
}
