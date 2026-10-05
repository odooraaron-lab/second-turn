// Plain lists for the client-side card forms (lib/cards.ts holds the server versions).
export const KINDS_LIST = [
  "Classic", "Family", "Strategy", "Party", "Word", "Trivia", "Kids", "Deduction",
  "Abstract", "Dexterity", "Card", "Dice", "Co-op", "Adventure", "Puzzle",
];
export const POWER_LIST = [
  { key: "strategy", label: "Strategy", hint: "How much skill and planning decide it" },
  { key: "luck", label: "Luck", hint: "How much dice, spins and draws decide it" },
  { key: "social", label: "Social", hint: "Talking, bluffing, teams and laughs" },
  { key: "speed", label: "Speed", hint: "Higher is quicker to play" },
] as const;
