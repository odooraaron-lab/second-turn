import type { CategoryId } from "./types";

export type Category = {
  id: CategoryId;
  label: string;
  /** Page heading and the start of the Google title */
  title: string;
  seoTitle: string;
  intro: string;
  /** Short line for chips and menus */
  blurb: string;
};

// The blog is organised by what people search for: a game's story, what it's worth, how to fix it,
// what to play, and where to buy.
export const categories: Category[] = [
  {
    id: "classic-games",
    label: "Classic games",
    title: "Classic board games: history and how they play",
    seoTitle: "Classic Board Games: History and How to Play",
    intro:
      "Where Monopoly, Cluedo, Scrabble and the rest came from, how they changed over the decades, and the games that filled Kiwi cupboards in the 70s, 80s and 90s.",
    blurb: "The stories behind the games",
  },
  {
    id: "collecting",
    label: "Collecting",
    title: "Collecting vintage board games",
    seoTitle: "Collecting Vintage Board Games in NZ",
    intro:
      "What old board games are worth, how to date an edition, and how to start a collection in New Zealand without filling the house.",
    blurb: "Values, editions and dating",
  },
  {
    id: "care-and-repair",
    label: "Care and repair",
    title: "Board game care and repair",
    seoTitle: "Board Game Care, Cleaning and Repair",
    intro:
      "Checking a game is complete, cleaning old pieces, getting rid of musty smells, fixing split boxes and replacing lost parts.",
    blurb: "Cleaning, fixing and missing pieces",
  },
  {
    id: "game-night",
    label: "Game night",
    title: "Game night ideas for families and friends",
    seoTitle: "Board Game Night Ideas for Families",
    intro:
      "Which classic games still work for families, two players, little kids and grandparents, plus house rules and rainy days at the bach.",
    blurb: "What to play and who with",
  },
  {
    id: "buying-in-nz",
    label: "Buying in NZ",
    title: "Buying and selling second-hand board games in NZ",
    seoTitle: "Buying Second-Hand Board Games in NZ",
    intro:
      "Where to find second-hand board games in New Zealand, how to read a listing, how games are couriered, and how to sell the ones you've finished with.",
    blurb: "Finding, buying and selling",
  },
];

export const getCategory = (id: string) => categories.find((c) => c.id === id) ?? null;
