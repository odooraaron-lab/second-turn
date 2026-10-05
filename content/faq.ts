import { site } from "@/site.config";

/** Questions people actually search for. Shown on the home page and given to Google as an FAQ. */
export function faqs() {
  const courier = `$${site.defaultShippingNzd}`;
  const list = [
    {
      q: "Where can I buy second hand board games in New Zealand?",
      a: `Right here: ${site.name} sells second hand and vintage board games, card games, jigsaws and spare parts, each one counted and photographed, at fixed Buy Now prices. Op shops, school fairs and Trade Me are good hunting grounds too; see our guide to where to find second hand board games in NZ.`,
      link: { href: "/blog/where-to-buy-second-hand-board-games-nz", label: "Where to find second hand board games in NZ" },
    },
    {
      q: "How is this different from buying a board game on Trade Me?",
      a: "There are no auctions to watch and no waiting for a listing to close: every game has a fixed Buy Now price and you pay by card straight away. Every game is counted against its rules and labelled Counted complete, Missing pieces or Not counted, with photos of everything in the box. We're not connected to Trade Me; we just think a checked, ready-to-play game is worth a little extra care.",
      link: { href: "/blog/buying-board-games-trade-me-vs-specialist", label: "Trade Me or a specialist shop?" },
    },
    {
      q: "Are second hand board games complete?",
      a: `Only if someone has counted them. Every game here says so on the listing: Counted complete means every piece has been checked against the rules.${
        site.returns.completenessDays > 0
          ? ` If a Counted complete game turns out to be short, tell us within ${site.returns.completenessDays} days and we'll find the piece or refund you.`
          : ""
      }`,
      link: { href: "/blog/how-to-check-a-board-game-is-complete", label: "How to check a game is complete" },
    },
    {
      q: "How much is delivery in NZ?",
      a: `Most games are ${courier} by tracked courier anywhere in New Zealand; the exact price is on each game's page.${
        site.pickup.enabled ? ` Or choose free pick-up in ${site.pickup.town}.` : ""
      } Games are sent within ${site.shipping.handlingDays.max} working days.`,
      link: { href: "/shipping-policy", label: "Shipping policy" },
    },
    {
      q: "Do you trade or buy board games?",
      a: site.tradeIns.enabled
        ? site.tradeIns.note
        : "Not at the moment. If you're trading or swapping games yourself, our guide covers swap groups, trading tips and how to value what you've got.",
      link: { href: "/blog/board-game-swaps-and-trading-nz", label: "Trading and swapping board games in NZ" },
    },
    {
      q: "Can I find replacement pieces for a board game?",
      a: "Yes. Spare tokens, cards, dice, boards and rules from classic games are listed under Spare pieces and parts, so the set you already own can be played again.",
      link: { href: "/shop/category/parts", label: "Spare pieces and parts" },
    },
  ];
  return list;
}

export const faqSchema = () => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs().map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
});
