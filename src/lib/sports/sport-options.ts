import { SPORT_IDS, type SportId } from "@/lib/sports/sport-id";
import { getSportModule } from "@/lib/sports/registry";

/** 建隊表單：運動選項（註解：順序與 UI 一致）。 */
export const SPORT_CREATE_OPTIONS: readonly SportId[] = SPORT_IDS;

/** 運動的繁中顯示名 */
export function getSportDisplayName(sport: SportId): string {
  return getSportModule(sport).labels.name;
}
