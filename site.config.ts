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
// Buying or trading in customers' old games. Off until you decide to offer it; when on, the home page FAQ says so.
const tradeIns = {
  enabled: false,
  note: "Got old games to sell or swap? Email us a photo of the box and what's inside and we'll make an offer.",
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
  tagline: "Second-hand board games NZ, counted and checked",
  // Google title for the home page (keep under ~60 characters)
  homeTitle: "Second Hand Board Games NZ | Buy Now | Second Turn",
  // Google description for the home page (keep under ~155 characters)
  description:
    "Buy second hand board games in New Zealand at fixed Buy Now prices. Vintage and family games, every piece counted, couriered NZ-wide or picked up in Whangārei.",
  keywords: [
    "second hand board games NZ",
    "used board games New Zealand",
    "buy board games online NZ",
    "vintage board games NZ",
    "retro board games NZ",
    "old board games for sale",
    "board games buy now",
    "cheap board games NZ",
    "board game trade NZ",
    "Trade Me board games alternative",
    "80s board games",
    "classic family board games",
    "board game replacement pieces NZ",
    "board games Whangārei",
    "board games Northland",
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
  tradeIns,
  // Days after shipping that opted-in buyers get a "how's game night going?" email with new games (needs CRON_SECRET).
  followUpDays: 21,
  dispatchNote: `Sent by tracked courier within ${shipping.handlingDays.max} working days, anywhere in New Zealand.`,

  // What kind of thing a listing is. Each gets its own page at /shop/category/<id>.
  // "intro" is shown on that page and used as its Google description.
  categories: [
    {
      id: "board-games",
      label: "Board games",
      title: "Second hand board games for sale NZ",
      intro:
        "Second hand board games at fixed Buy Now prices, every piece counted. Classic family games, strategy games and the ones you grew up with, couriered anywhere in New Zealand.",
    },
    {
      id: "card-games",
      label: "Card and dice games",
      title: "Second hand card and dice games NZ",
      intro: "Second hand card games, dice games and travel games, decks counted and dice included. Buy now and have it couriered NZ-wide.",
    },
    {
      id: "puzzles",
      label: "Jigsaws and puzzles",
      title: "Second hand jigsaw puzzles NZ",
      intro: "Second hand and vintage jigsaw puzzles and puzzle games, with piece counts noted where they've been checked. Courier NZ-wide or pick up in Whangārei.",
    },
    {
      id: "parts",
      label: "Spare pieces and parts",
      title: "Replacement board game pieces and spare parts NZ",
      intro:
        "Lost a piece? Spare tokens, cards, dice, boards and rules from classic board games, so the set at home can be played again. Cheap courier anywhere in New Zealand.",
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
      intro: "Board games from the 1960s and earlier: card boards, wooden pieces and box art from another age. Second hand, counted, Buy Now prices, couriered NZ-wide.",
    },
    {
      id: "1970s",
      label: "1970s",
      short: "70s",
      title: "1970s board games for sale NZ",
      intro: "1970s board games: bold box art, plastic everything, and the family games that filled the decade. Second hand, counted, Buy Now prices, couriered NZ-wide.",
    },
    {
      id: "1980s",
      label: "1980s",
      short: "80s",
      title: "1980s board games for sale NZ",
      intro: "1980s board games: trivia nights, electronic gadgets and the classics that lived in every Kiwi cupboard. Second hand, counted, Buy Now prices, couriered NZ-wide.",
    },
    {
      id: "1990s",
      label: "1990s",
      short: "90s",
      title: "1990s board games for sale NZ",
      intro: "1990s board games: VHS games, film tie-ins and the decade modern board games started. Second hand, counted, Buy Now prices, couriered NZ-wide.",
    },
    {
      id: "2000s-on",
      label: "2000s on",
      short: "2000s+",
      title: "Modern classic board games, second-hand NZ",
      intro: "Newer editions and modern classics, second-hand and checked, for families who just want a good game. Second hand, counted, Buy Now prices, couriered NZ-wide.",
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
