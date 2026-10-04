import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, getCategory } from "@/content/categories";
import { postsInCategory, readMinutes } from "@/content/posts";
import { JsonLd } from "@/components/JsonLd";
import { PostCover } from "@/components/PostCover";
import { formatDate } from "@/lib/format";
import { breadcrumbs, shareImage } from "@/lib/seo";
import { site } from "@/site.config";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => categories.map((c) => ({ id: c.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = getCategory((await params).id);
  if (!cat) return {};
  return {
    title: { absolute: `${cat.seoTitle} | ${site.name}` },
    description: cat.intro.slice(0, 155),
    alternates: { canonical: `/blog/category/${cat.id}` },
    openGraph: { title: cat.title, description: cat.intro, url: `/blog/category/${cat.id}`, images: [shareImage] },
  };
}

export default async function CategoryPage({ params }: Props) {
  const cat = getCategory((await params).id);
  if (!cat) notFound();
  const posts = postsInCategory(cat.id);
  const others = categories.filter((c) => c.id !== cat.id);

  return (
    <div className="wrap">
      <JsonLd
        data={breadcrumbs([
          ["Home", "/"],
          ["Blog", "/blog"],
          [cat.label, `/blog/category/${cat.id}`],
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: cat.title,
          description: cat.intro,
          url: `${site.url}/blog/category/${cat.id}`,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: posts.length,
            itemListElement: posts.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${site.url}/blog/${p.slug}`,
              name: p.title,
            })),
          },
        }}
      />

      <header className="page-head">
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link href="/blog">Blog</Link>
        </nav>
        <h1>{cat.title}</h1>
        <p>{cat.intro}</p>
        <p className="count">{posts.length} posts</p>
      </header>

      <ul className="post-list">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`}>
              <PostCover post={post} />
              <span className="post-meta">
                <time dateTime={post.date}>{formatDate(post.date)}</time>, {readMinutes(post)} minute read
              </span>
              <h3>{post.title}</h3>
              <p>{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="section" aria-labelledby="other-places">
        <div className="section-head">
          <h2 id="other-places">More topics</h2>
        </div>
        <nav className="chips chips-wrap" aria-label="Other blog topics">
          {others.map((c) => (
            <Link key={c.id} href={`/blog/category/${c.id}`} className="chip">
              {c.label}
            </Link>
          ))}
        </nav>
        <p style={{ marginTop: 24 }}>
          <Link href="/shop" className="btn">
            Shop second-hand games
          </Link>
        </p>
      </section>
    </div>
  );
}
