import type { MetadataRoute } from "next";
import { site } from "@/site.config";
import { posts } from "@/content/posts";
import { categories } from "@/content/categories";
import { listPublicProducts } from "@/lib/products";
import { listGames } from "@/lib/cards";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, games] = await Promise.all([listPublicProducts().catch(() => []), listGames().catch(() => [])]);
  const now = new Date();
  return [
    { url: site.url, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/shop`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    ...site.categories.map((c) => ({ url: `${site.url}/shop/category/${c.id}`, lastModified: now, priority: 0.7 })),
    ...site.eras.map((e) => ({ url: `${site.url}/shop/era/${e.id}`, lastModified: now, priority: 0.7 })),
    ...products.map((p) => ({
      url: `${site.url}/shop/${p.slug}`,
      lastModified: new Date(p.updated_at),
      priority: p.status === "sold" ? 0.4 : 0.8,
      images: p.images.slice(0, 3),
    })),
    { url: `${site.url}/cards`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    ...products
      .filter((p) => p.card_no)
      .map((p) => ({ url: `${site.url}/cards/${p.card_no}`, lastModified: new Date(p.updated_at), priority: 0.4 })),
    ...games.map((g) => ({ url: `${site.url}/cards/${g.game_no}`, priority: 0.5 })),
    { url: `${site.url}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...categories.map((c) => ({ url: `${site.url}/blog/category/${c.id}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...posts.map((p) => ({ url: `${site.url}/blog/${p.slug}`, lastModified: new Date(p.date), priority: 0.6 })),
    { url: `${site.url}/about`, priority: 0.5 },
    { url: `${site.url}/contact`, priority: 0.4 },
    { url: `${site.url}/shipping-policy`, priority: 0.4 },
    { url: `${site.url}/returns-policy`, priority: 0.4 },
    { url: `${site.url}/terms`, priority: 0.3 },
    { url: `${site.url}/privacy-policy`, priority: 0.3 },
  ];
}
