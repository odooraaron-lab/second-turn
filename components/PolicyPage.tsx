import Link from "next/link";
import { JsonLd } from "./JsonLd";
import { breadcrumbs } from "@/lib/seo";
import { formatDate } from "@/lib/format";
import { site } from "@/site.config";

export const policyLinks = [
  { href: "/shipping-policy", label: "Shipping" },
  { href: "/returns-policy", label: "Returns and refunds" },
  { href: "/terms", label: "Terms of sale" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/contact", label: "Contact" },
];

/** Shared frame for the policy pages: heading, last-updated date, links between policies. */
export function PolicyPage({ title, path, intro, children }: { title: string; path: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="wrap">
      <JsonLd
        data={breadcrumbs([
          ["Home", "/"],
          [title, path],
        ])}
      />
      <header className="article-head">
        <h1>{title}</h1>
        {intro && <p className="policy-intro">{intro}</p>}
        <p className="policy-updated">Last updated {formatDate(site.policiesUpdated)}</p>
      </header>
      <nav className="chips chips-wrap policy-nav" aria-label="Shop policies">
        {policyLinks.map((l) => (
          <Link key={l.href} href={l.href} className="chip" aria-current={l.href === path ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="prose policy">{children}</div>
    </div>
  );
}

/** "email hello@… " link, or a pointer to the Contact page if no email is set yet. */
export function ContactLine() {
  return site.contactEmail ? (
    <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
  ) : (
    <Link href="/contact">our Contact page</Link>
  );
}
