// Blog posts. Each category has its own file in content/blog/.
// To add one, copy an entry, give it a new slug and date, pick a category (see content/categories.ts) and write the body.
// Body format: blank line between paragraphs, "## " for headings, "- " for list items,
// **bold**, *italic*, and [link text](/shop).
// Then run: python3 scripts/blog-images.py   (paints its cover picture)

import type { Post, CategoryId } from "./types";
import { classicGamesPosts } from "./blog/classic-games";
import { collectingPosts } from "./blog/collecting";
import { careAndRepairPosts } from "./blog/care-and-repair";
import { gameNightPosts } from "./blog/game-night";
import { buyingInNzPosts } from "./blog/buying-in-nz";

export type { Post, CategoryId };

export const posts: Post[] = [
  ...classicGamesPosts,
  ...collectingPosts,
  ...careAndRepairPosts,
  ...gameNightPosts,
  ...buyingInNzPosts,
];

export const getPost = (slug: string) => posts.find((p) => p.slug === slug) ?? null;
export const sortedPosts = () => [...posts].sort((a, b) => b.date.localeCompare(a.date));
export const featuredPosts = () => sortedPosts().filter((p) => p.featured);
export const postsInCategory = (id: CategoryId) => sortedPosts().filter((p) => p.category === id);

export const postYear = (p: Post) => p.date.slice(0, 4);

/** Posts grouped by year, newest year first. */
export function postsByYear(list: Post[] = sortedPosts()) {
  const years = new Map<string, Post[]>();
  for (const p of list) years.set(postYear(p), [...(years.get(postYear(p)) ?? []), p]);
  return [...years.entries()].sort((a, b) => b[0].localeCompare(a[0]));
}

const words = (p: Post) => p.body.split(/\s+/).filter(Boolean).length;
export const wordCount = words;
export const readMinutes = (p: Post) => Math.max(2, Math.round(words(p) / 220));

/** Other posts: same category first, then the most shared keywords. */
export function relatedPosts(post: Post, n = 3) {
  const terms = (p: Post) => new Set(p.keywords.flatMap((k) => k.toLowerCase().split(/\s+/)).filter((w) => w.length > 3));
  const mine = terms(post);
  return sortedPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({
      p,
      score: (p.category === post.category ? 5 : 0) + [...terms(p)].filter((w) => mine.has(w)).length,
    }))
    .sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date))
    .slice(0, n)
    .map((x) => x.p);
}

// Words that tie a post to a decade, beyond the decade link in its call to action.
const eraTerms: Record<string, string[]> = {
  "1960s-and-earlier": ["1930s", "1940s", "1950s", "1960s", "60s", "victorian", "wartime", "wooden"],
  "1970s": ["1970s", "70s", "seventies"],
  "1980s": ["1980s", "80s", "eighties"],
  "1990s": ["1990s", "90s", "nineties", "vhs"],
  "2000s-on": ["2000s", "modern classic", "modern edition", "new edition"],
};

/** The posts most closely tied to a decade: its own call-to-action posts first, then topic matches. */
export function postsForEra(eraId: string, n = 6) {
  const terms = eraTerms[eraId] ?? [eraId];
  return sortedPosts()
    .map((p) => {
      const head = `${p.title} ${p.description} ${p.keywords.join(" ")}`.toLowerCase();
      const body = p.body.toLowerCase();
      let score = p.shop?.era === eraId ? 20 : 0;
      if (p.body.includes(`/shop/era/${eraId}`)) score += 8;
      for (const t of terms) {
        const word = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
        if (word.test(head)) score += 4;
        score += Math.min(4, (body.match(word) ?? []).length);
      }
      return { p, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.date.localeCompare(a.p.date))
    .slice(0, n)
    .map((x) => x.p);
}
