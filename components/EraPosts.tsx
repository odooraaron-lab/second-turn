import Link from "next/link";
import { getCategory } from "@/content/categories";
import { PostCover } from "./PostCover";
import { postsForEra, readMinutes } from "@/content/posts";

/** A swipeable row of blog posts that relate to a decade. Sits above the listings on decade pages. */
export function EraPosts({ eraId, label }: { eraId: string; label: string }) {
  const posts = postsForEra(eraId, 6);
  if (!posts.length) return null;

  return (
    <section className="era-posts" aria-labelledby="era-posts-title">
      <div className="section-head">
        <h2 id="era-posts-title">Reading about the {label}</h2>
        <Link href="/blog">All posts</Link>
      </div>
      <ul className="hscroll" aria-label={`Posts about games from the ${label}, scroll sideways`}>
        {posts.map((p) => (
          <li key={p.slug}>
            <Link href={`/blog/${p.slug}`} className="hpost">
              <PostCover post={p} variant="wide" />
              <span className="hpost-kicker">{getCategory(p.category)?.label}</span>
              <h3>{p.title}</h3>
              <p>{p.description}</p>
              <span className="hpost-meta">{readMinutes(p)} minute read</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
