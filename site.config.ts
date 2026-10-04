// Everything shop-specific lives here, so names, wording and settings can change without touching the pages.

export type Theme = "arcade";

// Shipping, pick-up and returns. These feed the Shipping and returns page, the checkout delivery
// estimate and the Google structured data, so all three always agree.
const shipping = {
  handlingDays: { min: 1, max: 3 }, // working days to pack and hand to the courier
  transitDays: { min: 1, max: 3 }, // working days the courier takes within NZ
};
const pickup = {
  enabled: true, // false hides the pick-up option everywhere
  town: "Whangārei",
  note: "Free. We'll email you to arrange a time.",
};
const returns = {
  // 0 = no change-of-mind returns (faulty, damaged or not-as-described items are still put right).
  // Set to e.g. 14 to accept returns within 14 days of delivery; the page and Google data update to match.
  days: 0,
  // A game listed as "Counted complete" that turns out to be short: tell us within this many days of delivery
  // and we find the piece or refund. 0 removes the promise from the site.
  completenessDays: 7,
};

export const site = {
  // TODO: placeholder name. Change it here and the whole site, emails and Stripe follow.
  name: "Second Turn",
  tagline: "Second-hand board games, counted and checked",
  // Google title for the home page (keep under ~60 characters)
  homeTitle: "Second Turn | Second-Hand & Vintage Board Games NZ",
  // Google description for the home page (keep under ~155 characters)
  description:
    "Second-hand and vintage board games, card games and jigsaws, counted piece by piece. One-off listings, couriered NZ-wide or picked up in Whangārei.",
  keywords: [
    "second hand board games NZ",
    "vintage board games NZ",
    "retro board games",
    "old board games for sale",
    "used board games NZ",
    "80s board games",
    "classic family board games",
    "board game replacement pieces NZ",
    "board game spare parts",
    "board games Whangārei",
  ],
  url: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  locale: "en_NZ",
  currency: "nzd",

  // Colour direction: "Arcade pop" (deep violet, cream, hot pink, teal). Colours live at the top of app/globals.css.
  theme: "arcade" as Theme,

  contactEmail: "", // e.g. "hello@secondturn.co.nz", shown in the footer when filled in
  instagram: "",
  facebook: "",

  // Default courier price for new listings (NZD). Can be changed per listing.
  defaultShippingNzd: 12,
  shipping,
  pickup,
  returns,
  // Days after shipping that opted-in buyers get a "how's game night going?" email with new games (needs CRON_SECRET).
  followUpDays: 21,
  dispatchNote: `Sent by tracked courier within ${shipping.handlingDays.max} working days, anywhere in New Zealand.`,

  // What kind of thing a listing is. Each gets its own page at /shop/category/<id>.
  // "intro" is shown on that page and used as its Google description.
  categories: [
    {
      id: "board-games",
      label: "Board games",
      title: "Second-hand board games for sale NZ",
      intro:
        "Classic and vintage board games, second-hand and checked piece by piece. Family favourites, strategy games and the ones you grew up with.",
    },
    {
      id: "card-games",
      label: "Card and dice games",
      title: "Card and dice games",
      intro: "Second-hand card games, dice games and travel games. Decks counted, dice included, rules in the box.",
    },
    {
      id: "puzzles",
      label: "Jigsaws and puzzles",
      title: "Second-hand jigsaw puzzles NZ",
      intro: "Vintage and second-hand jigsaws and puzzle games, with piece counts noted where we've checked them.",
    },
    {
      id: "parts",
      label: "Spare pieces and parts",
      title: "Replacement board game pieces NZ",
      intro:
        "Lost a piece? Spare tokens, cards, dice, boards and rules from classic games, so the set at home can be played again.",
    },
  ],

  // The decade a game is from, chosen per listing in admin. Each gets its own page at /shop/era/<id>,
  // which helps people searching for, say, "80s board games NZ" find the shop.
  eras: [
    {
      id: "1960s-and-earlier",
      label: "1960s and earlier",
      short: "Pre-70s",
      title: "1950s and 1960s board games for sale NZ",
      intro: "Board games from the 1960s and earlier: card boards, wooden pieces and box art from another age.",
    },
    {
      id: "1970s",
      label: "1970s",
      short: "70s",
      title: "1970s board games for sale NZ",
      intro: "1970s board games: bold box art, plastic everything, and the family games that filled the decade.",
    },
    {
      id: "1980s",
      label: "1980s",
      short: "80s",
      title: "1980s board games for sale NZ",
      intro: "1980s board games: trivia nights, electronic gadgets and the classics that lived in every Kiwi cupboard.",
    },
    {
      id: "1990s",
      label: "1990s",
      short: "90s",
      title: "1990s board games for sale NZ",
      intro: "1990s board games: VHS games, film tie-ins and the decade modern board games started.",
    },
    {
      id: "2000s-on",
      label: "2000s on",
      short: "2000s+",
      title: "Modern classic board games, second-hand NZ",
      intro: "Newer editions and modern classics, second-hand and checked, for families who just want a good game.",
    },
  ],

  // Condition of the box and components, chosen per listing. "schema" is what Google is told.
  conditions: [
    { id: "sealed", label: "Sealed", note: "Still in its shrink wrap, never opened.", schema: "NewCondition" },
    { id: "like-new", label: "Like new", note: "Barely played. Crisp box, clean pieces.", schema: "UsedCondition" },
    { id: "good", label: "Good", note: "Played and looked after. Light shelf wear.", schema: "UsedCondition" },
    { id: "well-played", label: "Well played", note: "Loved hard: box wear, splits or tape. Plays fine.", schema: "UsedCondition" },
    { id: "for-parts", label: "For parts", note: "Sold for its pieces, not as a playable game.", schema: "DamagedCondition" },
  ],

  // Is everything in the box? Shown on every listing, because it's the first thing buyers ask.
  completeness: [
    { id: "complete", label: "Counted complete", note: "We've counted every piece against the rules." },
    { id: "missing", label: "Missing pieces", note: "Some pieces are missing. Exactly what is listed in the description." },
    { id: "not-counted", label: "Not counted", note: "Looks full, but we haven't counted it piece by piece." },
  ],

  // Price filters in the menu and shop (NZD, before courier).
  priceBands: [
    { id: "under-20", label: "Under $20", min: 0, max: 1999 },
    { id: "20-to-50", label: "$20 to $50", min: 2000, max: 5000 },
    { id: "over-50", label: "Over $50", min: 5001, max: Number.MAX_SAFE_INTEGER },
  ],

  // TODO: replace with your own story. Your town and why you do this help Google rank you for local searches.
  about: {
    short:
      "Second Turn finds old board games, counts every piece, and sends them back out to be played. Based in Whangārei, couriering NZ-wide.",
    long: [
      "Second Turn started with a cupboard of old games and a simple question: how many of them were actually complete? The answer was not many. Missing dice, a short Scrabble bag, Cluedo with no revolver.",
      "So every game here is opened, sorted and counted against its rules before it's listed. If it's complete, it says so. If something's missing, the listing says exactly what. Box wear, tape and pen marks are photographed, not hidden.",
      "Everything is one-off. There's no warehouse and no restocking, just the games that come through the door. Pick up in Whangārei, or have it couriered anywhere in New Zealand.",
    ],
  },
};

export const categoryLabel = (id: string) => site.categories.find((c) => c.id === id)?.label ?? id;
export const eraLabel = (id: string) => site.eras.find((e) => e.id === id)?.label ?? "";
export const conditionOf = (id: string) => site.conditions.find((c) => c.id === id) ?? null;
export const completenessOf = (id: string) => site.completeness.find((c) => c.id === id) ?? null;
