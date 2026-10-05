import { listGames } from "./cards";
import type { GameOption } from "@/components/listing/CardStatsFields";

/** The Game Index, trimmed to what the listing form needs. */
export async function gameOptions(): Promise<GameOption[]> {
  const games = await listGames().catch(() => []);
  return games.map(({ game_no, name, year, designer, publisher, min_players, max_players, play_minutes, min_age, kind, mechanics, strategy, luck, social, speed }) => ({
    game_no, name, year, designer, publisher, min_players, max_players, play_minutes, min_age, kind, mechanics, strategy, luck, social, speed,
  }));
}
