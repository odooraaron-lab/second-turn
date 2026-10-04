"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/site.config";

const pages = [
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "About" },
];

function Chevron() {
  return (
    <svg className="chev-icon" width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      {open ? (
        <path d="M4 4l10 10M14 4 4 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path d="M2.5 6h13M2.5 12h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  // Close whenever the page changes, and on Escape.
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("menu-open");
    };
  }, [open]);

  const inShop = path.startsWith("/shop");
  const current = (href: string) => (path === href ? "page" : undefined);

  return (
    <header className="site-header" data-open={open || undefined}>
      <div className="header-bar">
        <Link href="/" className="wordmark">
          <span className="wordmark-die" aria-hidden />
          {site.name}
        </Link>

        <nav className="header-nav" aria-label="Main">
          <button
            type="button"
            className="nav-shop"
            aria-expanded={open}
            aria-controls="shop-menu"
            aria-current={inShop ? "page" : undefined}
            onClick={() => setOpen((o) => !o)}
          >
            Shop <Chevron />
          </button>
          {pages.map((p) => (
            <Link key={p.href} href={p.href} className="nav-link" aria-current={path.startsWith(p.href) ? "page" : undefined}>
              {p.label}
            </Link>
          ))}
        </nav>

        <div className="header-mobile">
          <Link href="/shop" className="nav-link" aria-current={inShop ? "page" : undefined}>
            Shop
          </Link>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={open}
            aria-controls="shop-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            <MenuIcon open={open} />
            <span>{open ? "Close" : "Menu"}</span>
          </button>
        </div>
      </div>

      <div className="menu-backdrop" onClick={() => setOpen(false)} aria-hidden />

      <div
        id="shop-menu"
        className="menu-panel"
        inert={!open}
        onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
      >
        <div className="wrap menu-grid">
          <section className="menu-group menu-main">
            <h2>Shop</h2>
            <ul>
              <li>
                <Link href="/shop" aria-current={current("/shop")}>
                  Every game
                </Link>
              </li>
              {site.categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/shop/category/${c.id}`} aria-current={current(`/shop/category/${c.id}`)}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="menu-group">
            <h2>By decade</h2>
            <ul className="menu-styles">
              {site.eras.map((e) => (
                <li key={e.id}>
                  <Link href={`/shop/era/${e.id}`} aria-current={current(`/shop/era/${e.id}`)}>
                    {e.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="menu-group">
            <h2>By price</h2>
            <ul>
              {site.priceBands.map((b) => (
                <li key={b.id}>
                  <Link href={`/shop?price=${b.id}`}>{b.label}</Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="menu-group menu-more">
            <h2>More</h2>
            <ul>
              {pages.map((p) => (
                <li key={p.href}>
                  <Link href={p.href}>{p.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/shipping-and-returns">Delivery and returns</Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </header>
  );
}
