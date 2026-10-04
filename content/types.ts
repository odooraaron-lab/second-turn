export type CategoryId = "classic-games" | "collecting" | "care-and-repair" | "game-night" | "buying-in-nz";

export type Post = {
  slug: string;
  title: string; // shown on the page
  seoTitle: string; // Google title, keep under ~48 characters (the site name is added)
  description: string; // Google description, under ~155 characters
  date: string; // YYYY-MM-DD
  category: CategoryId;
  keywords: string[];
  /** Shown under "Popular reads" in the footer */
  featured?: boolean;
  /** Call to action at the end of the post; with an era, a few games from that decade are shown too */
  shop?: { label: string; href: string; era?: string; category?: string };
  body: string;
};
