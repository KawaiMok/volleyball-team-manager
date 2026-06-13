import { Sport } from "@/generated/prisma/client";
import { getSportModule } from "@/lib/sports/registry";
import type { SportMatchClientModule } from "@/lib/sports/match/types";
import type { SportId } from "@/lib/sports/sport-id";

/** Prisma Sport → client SportId（註解：enum 字串與 SportId 一致）。 */
export function prismaSportToId(sport: Sport): SportId {
  return sport as SportId;
}

/** Server／API：依運動取得比賽統計模組 */
export function getSportMatchModule(sport: Sport): SportMatchClientModule | null {
  return getSportModule(prismaSportToId(sport)).match;
}
