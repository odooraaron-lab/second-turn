import Link from "next/link";
import { site } from "@/site.config";
import { featuredPosts } from "@/content/posts";

export function Footer() {
  const popular = featuredPosts().slice(0, 5);
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-inner">
          <div className="footer-brand">
            <p className="footer-name">{site.name}</p>
            <p>
              Second-hand board games, counted and checked. One-off listings, couriered NZ-wide
              {site.pickup.enabled ? ` or picked up in ${site.pickup.town}` : ""}.
            </p>
          </div>

          <nav aria-label="Shop" className="footer-col">
            <h2>Shop</h2>
            <Link href="/shop">Every game</Link>
            {site.categories.map((c) => (
              <Link key={c.id} href={`/shop/category/${c.id}`}>
                {c.label}
              </Link>
            ))}
          </nav>

          <nav aria-label="Games by decade" className="footer-col">
            <h2>By decade</h2>
            {site.eras.map((e) => (
              <Link key={e.id} href={`/shop/era/${e.id}`}>
                {e.label}
              </Link>
            ))}
          </nav>

          {popular.length > 0 && (
            <nav aria-label="Popular reads" className="footer-col">
              <h2>Popular reads</h2>
              {popular.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`}>
                  {p.seoTitle}
                </Link>
              ))}
            </nav>
          )}

          <nav aria-label="Popular searches" className="footer-col">
            <h2>Popular searches</h2>
            <Link href="/shop/category/board-games">Second hand board games NZ</Link>
            <Link href="/shop/era/1980s">80s board games</Link>
            <Link href="/shop/era/1970s">70s board games</Link>
            <Link href="/shop?price=under-20">Cheap board games under $20</Link>
            <Link href="/shop/category/parts">Replacement game pieces</Link>
          </nav>

          <nav aria-label="About the shop" className="footer-col">
            <h2>Info</h2>
            <Link href="/about">About</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/contact">Contact</Link>
            <Link href="/shipping-policy">Shipping policy</Link>
            <Link href="/returns-policy">Returns and refunds</Link>
            <Link href="/terms">Terms of sale</Link>
            <Link href="/privacy-policy">Privacy policy</Link>
            {site.contactEmail && <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>}
            {site.instagram && (
              <a href={site.instagram} rel="me noopener">
                Instagram
              </a>
            )}
            {site.facebook && (
              <a href={site.facebook} rel="me noopener">
                Facebook
              </a>
            )}
          </nav>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} {site.name}. Secure checkout by Stripe.
          </p>
          <a href="#top" className="text-link">
            Back to top
          </a>
        </div>
      </div>
    </footer>
  );
}
