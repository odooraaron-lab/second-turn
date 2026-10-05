# Second Turn

Second-hand board game shop. Built the same way as the Melody Mitt and Spare Change shops: Next.js 16 on Vercel, Neon Postgres, Vercel Blob for photos, Stripe Checkout for payments, Resend for order emails.

"Second Turn" is a placeholder name. Change `name` in `site.config.ts`, then run `python3 scripts/brand-images.py` to redraw the logo and share image with the new name.

- Public site: `/`, `/shop`, `/shop/[slug]`, `/shop/category/[id]`, `/shop/era/[id]`, `/blog`, `/about`, `/contact`, `/shipping-policy`, `/returns-policy`, `/terms`, `/privacy-policy`
- Admin: `/admin` (list games from your phone camera, orders, setup checks)

## Setup

### 1. GitHub and Vercel
Put this folder in a new GitHub repo, then in Vercel: **Add New > Project** and import it. The first deploy may fail until the variables below are added.

### 2. Database (Neon)
In the Vercel project: **Storage > Create > Neon**. This adds `DATABASE_URL`.

Use a new database for this shop. The tables are created automatically on the first visit, so there's no SQL to run. They're named `bg_products`, `bg_orders` and `bg_email_optouts`, so they can't clash with another shop's tables even if a database is shared by mistake.

### 3. Photo storage (Vercel Blob)
**Storage > Create > Blob**, connect it to the project. This adds `BLOB_READ_WRITE_TOKEN`.

### 4. Stripe
- `STRIPE_SECRET_KEY`: Stripe dashboard > Developers > API keys (start with the test key).
- Webhook: easiest is **Admin > Setup > Create webhook** once the site is live, then paste the signing secret it shows into `STRIPE_WEBHOOK_SECRET` and redeploy. Or by hand: Developers > Webhooks > Add endpoint
  - URL: `https://YOUR-SITE/api/stripe/webhook`
  - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`

The Stripe account is shared with your other shops. Every checkout here is tagged `site=boardgames` and the webhook ignores anything without that tag, so the shops never mix up each other's sales.

### 5. Emails (Resend)
- `RESEND_API_KEY` from resend.com.
- Once the domain is bought, verify it in Resend, then set `EMAIL_FROM`, e.g. `Second Turn <orders@secondturn.co.nz>`.
- `OWNER_EMAIL`: where your sale alerts go.

Until a domain is verified, Resend only delivers to your own Resend account email. Orders still work.

### 6. Admin login
Set `ADMIN_USERNAME`, `ADMIN_PASSWORD` (long and unique) and `SESSION_SECRET` (run `openssl rand -base64 32`).

### 7. Site URL
`NEXT_PUBLIC_SITE_URL` = the live URL, no trailing slash. Update it when the domain is connected, then redeploy.

Redeploy after adding variables. See `.env.example` for the full list.

## Testing a purchase
With Stripe test keys, list a game in `/admin`, then buy it with card `4242 4242 4242 4242`, any future expiry and any CVC. Try it once with courier and once with pick-up. It should turn Sold and appear in `/admin/orders`.

## Collector cards
Every listing is shown as a collector card, ported from the Property Wars trading card: yellow bevelled border, face tinted by rarity, holo shine on rare cards, the price as a hanging tag, condition as orbs, the year as the big number, and a card number (No. 0012). There's nothing extra to fill in: the card is made from the listing the moment it's saved, and shown at the top of the game's edit page in admin.

Rarity is worked out automatically (`lib/collector.ts`): counted complete, better condition and older games score higher.
- **Common**, **Uncommon**, **Rare** (holo) and **Vintage** (holo) by score
- **Sealed** games always get the gold Sealed frame
- Spare parts are always Common

Card styles: `app/collector-card.css`. Card layout: `components/CollectorCard.tsx`.

## Listing a game
Admin asks for photos (box front, box back, everything laid out), title, category, **is everything in the box?**, condition, description, decade, year, publisher and players.

- **Counted complete**: every piece counted against the rules. Shown with a green tick.
- **Missing pieces**: counted, and the description must say what's missing (admin won't save without it).
- **Not counted**: looks full but not checked piece by piece.

Conditions: Sealed, Like new, Good, Well played, For parts. Google is told the matching condition (new, used or damaged).

## Delivery and pick-up
Each game has its own courier price (default $12, change it in `site.config.ts`). If pick-up is on, buyers choose **Courier** or **Pick up in Whangārei** on the game's page before paying. Pick-up checkouts don't ask for an address. Your sale email says it's a pick-up, and the order shows **Mark as collected** instead of a tracking box. The quick "Buy now" button on listing cards always uses courier.

Turn pick-up off, or change the town, under `pickup` in `site.config.ts`.

## Returns and the completeness promise
`returns.days` = 0 means no change-of-mind returns (faulty or not-as-described is still put right). `returns.completenessDays` = 7 adds a promise: if a game listed as Counted complete turns out short, the buyer has 7 days to tell you and you find the piece or refund. Set it to 0 to remove the promise from the site.

## Browsing by decade
Each game can be given a decade in admin. Every decade and category has its own page Google can index, for example `/shop/era/1980s` and `/shop/category/parts`, linked from the menu, the home board, the footer and the blog. Edit the decades, their Google titles and intros in `site.config.ts`.

## Blog
36 posts in five topics (classic games, collecting, care and repair, game night, buying in NZ), in `content/blog/`. Mark up to five with `featured: true` to list them under "Popular reads" in the footer. Posts link to each other and to shop pages, and posts with a decade or category show a few matching games at the end.

To add a post: copy an entry in the right file, give it a new slug and date, write the body, then run `python3 scripts/blog-images.py` to draw its cover. To use a real photo instead, save it over `public/blog/<slug>.jpg` (landscape, about 1200 × 675).

## Buyer emails
- **Order confirmation** to the buyer (courier or pick-up wording), with a few more games from the same decade, and a sale alert to you.
- **Shipped** email with tracking when you mark a courier order shipped. Pick-ups are just marked collected.
- **Follow-up** about 21 days later, only to buyers who ticked "Email me when new games are listed?" at checkout, with one-click unsubscribe. Set `CRON_SECRET` to switch it on; it runs daily via `vercel.json`. Change the delay with `followUpDays`.

## Getting found on Google
Built in: page titles and descriptions aimed at searches like "second hand board games NZ", "buy board games online NZ" and "80s board games", product data for Google (price, Buy Now availability, condition, NZ delivery and returns), an FAQ on the home page that Google can show as answers, breadcrumbs, a sitemap at `/sitemap.xml`, and 36 blog posts that link into the shop.

Two free things worth doing once the site is live:
1. **Google Search Console** (search.google.com/search-console): add the site, then submit `https://YOUR-SITE/sitemap.xml`. This gets new games indexed faster and shows which searches find you.
2. **Google Merchant Center** (merchants.google.com): free product listings in Google Shopping. Add a product source by scheduled fetch from `https://YOUR-SITE/feeds/google.xml`, set to daily. The same feed works for Facebook and Instagram catalogues. Only games that can be bought right now are in it.

### Policies for Google Ads and Merchant Center
Google checks that a shop shows clear shipping and returns policies, a privacy policy and a way to contact you, and that the product data matches them. All of that is built in, linked from every page footer, the menu, each game's page and Stripe checkout:

- **Shipping policy** `/shipping-policy`: NZ only, cost per game shown before checkout, handling and delivery times, tracking, packing, pick-up, lost or damaged parcels.
- **Returns and refunds** `/returns-policy`: change-of-mind rule, faulty or not-as-described, the counted-complete promise, cancellations, how and when refunds are paid, Consumer Guarantees Act wording.
- **Terms of sale** `/terms`, **Privacy policy** `/privacy-policy` (NZ Privacy Act 2020) and **Contact** `/contact`.

Every number in them (days, hours, prices, GST, pick-up) comes from `site.config.ts`, the same place the product data for Google reads from, so the pages and the data can't disagree. Change a setting, update `policiesUpdated`, redeploy.

**Before applying for Google Ads or Merchant Center:**
1. Set `contactEmail` in `site.config.ts` (required) and, if you like, `business.phone`. Set `business.tradingName`.
2. Check the returns settings match what you want to offer: `returns.days` (0 = no change-of-mind returns), `completenessDays`, `cancelBeforeDispatch`, `refundDays`.
3. In Merchant Center: **Settings > Business info** (name, website, contact email), verify and claim the website, then add a **Return policy** for NZ that matches `/returns-policy`, and **Shipping and returns > Shipping** for NZ with handling 1 to 3 days and transit 1 to 3 days, rate taken from the feed. Paste the policy URLs from **Admin > Setup**.

This is a solid starting point written from the shop's settings, not legal advice; read it through once and adjust anything that doesn't match how you actually work.

Trade-ins: `tradeIns` in `site.config.ts` is off. Turn it on and write your own note if you start buying or swapping games, and the home page FAQ will say so.

## Editing content
- Name, tagline, Google titles, keywords, categories, decades, conditions, price filters, courier price, pick-up, returns, About text: `site.config.ts`
- Colours (Arcade pop): the tokens at the top of `app/globals.css`
- Home page board squares: `app/(site)/page.tsx`
- Policy wording: `app/(site)/shipping-policy`, `returns-policy`, `terms`, `privacy-policy` and `contact` (the numbers and switches come from `site.config.ts`)
- Logo, app icons, share image: `python3 scripts/brand-images.py` (needs `pip install pillow`)
- Blog covers: `python3 scripts/blog-images.py` (`--all` to redraw everything; needs `pip install pillow numpy`)

The fonts are Bungee (headlines), Nunito Sans (everything else) and Fredoka (card names and numbers), all under the SIL Open Font License; copies for the image scripts are in `scripts/fonts`.

## How sales work
Each game is one-off. Pressing Buy now places a 30-minute hold so two people can't pay for the same game; an abandoned checkout releases it. When payment succeeds the game is marked Sold and stays listed until you take it down in admin. Every listing is copied to the Stripe product catalogue automatically, and sold, hidden or deleted games are archived there. **Admin > Setup** checks Stripe, the webhook, emails and every listing.
