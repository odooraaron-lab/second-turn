import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage, ContactLine } from "@/components/PolicyPage";
import { site } from "@/site.config";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${site.name} collects, uses, stores and protects your personal information, under the New Zealand Privacy Act 2020.`,
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicy() {
  return (
    <PolicyPage
      title="Privacy policy"
      path="/privacy-policy"
      intro={`${site.business.tradingName} (${site.business.location}) collects only the information needed to sell and deliver your games. This policy follows the New Zealand Privacy Act 2020.`}
    >
      <h2 id="collect">What we collect</h2>
      <ul>
        <li>
          <strong>When you buy:</strong> your name, email address, phone number, delivery address (not needed for pick-up),
          what you bought and how much you paid.
        </li>
        <li>
          <strong>Payment details:</strong> entered on Stripe's secure checkout page. Your card number never reaches this
          website and we never see or store it.
        </li>
        <li>
          <strong>If you make an account:</strong> your username, email address and a scrambled (hashed) version of your
          password, which can't be turned back into the password. Plus the games you list, their photos and card stats.
          Your username appears on your cards; your email is never shown.
        </li>
        <li>
          <strong>When you email us:</strong> your email address and whatever you choose to tell us.
        </li>
        <li>
          <strong>When you browse:</strong> standard technical information your browser sends, such as pages visited and
          device type, which our hosting provider keeps briefly in server logs to keep the site running and secure.
        </li>
      </ul>

      <h2 id="use">How we use it</h2>
      <ul>
        <li>To process your order, send it or arrange pick-up, and email you about it (confirmation, tracking).</li>
        <li>To answer your questions and handle returns or refunds.</li>
        <li>
          To email you about new games, <strong>only if you ticked "Yes please" at checkout</strong>. Every one of those
          emails has an unsubscribe link, and you can opt out at any time.
        </li>
        <li>To keep records we're required to keep for tax and accounting.</li>
      </ul>
      <p>We don't sell or rent your information to anyone.</p>

      <h2 id="share">Who we share it with</h2>
      <p>We use a small number of trusted services to run the shop. Each only receives what it needs:</p>
      <ul>
        <li>
          <strong>Stripe</strong>: card payments and the checkout page.
        </li>
        <li>
          <strong>The courier</strong>: your name, address and phone number, to deliver your parcel.
        </li>
        <li>
          <strong>Resend</strong>: sends our order emails.
        </li>
        <li>
          <strong>Vercel and Neon</strong>: host the website and its database, where orders are stored.
        </li>
      </ul>
      <p>
        Some of these providers store information on servers outside New Zealand, including in the United States. We use
        providers that protect personal information to standards comparable to the Privacy Act. We may also share
        information if the law requires it.
      </p>

      <h2 id="cookies">Cookies</h2>
      <p>
        This site uses only essential cookies: one that briefly holds a game for you while you're at checkout, one that keeps
        you logged in if you have an account, and one that keeps the shop owner logged in to the admin area. We don't use advertising or tracking cookies. If that changes,
        for example if we start measuring ads, we'll update this policy first.
      </p>

      <h2 id="keep">How long we keep it</h2>
      <p>
        Order records are kept for seven years, as New Zealand tax law requires. Account details are kept while your account
        is open; ask us to close it and we'll delete them, except anything tied to a sale we must keep for tax. Other
        information is kept only as long as it's needed, then deleted.
      </p>

      <h2 id="secure">Keeping it safe</h2>
      <p>
        The site is served over a secure HTTPS connection, payments are handled by Stripe, and access to order information
        is limited to the shop owner.
      </p>

      <h2 id="rights">Seeing or correcting your information</h2>
      <p>
        You can ask to see the personal information we hold about you, ask us to correct it, or ask us to delete it where
        we're not required to keep it. Email <ContactLine /> and we'll respond within 20 working days. If you're unhappy with
        how we've handled your information, you can complain to the{" "}
        <a href="https://www.privacy.org.nz" rel="noopener">
          Office of the Privacy Commissioner
        </a>
        .
      </p>

      <h2 id="changes">Changes</h2>
      <p>
        If this policy changes, the new version will be posted here with a new date. See also our{" "}
        <Link href="/terms">terms of sale</Link>.
      </p>
    </PolicyPage>
  );
}
