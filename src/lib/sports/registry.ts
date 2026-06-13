import { basketballSportModule, soccerSportModule, volleyballSportModule } from "@/lib/sports/modules";
import type { SportId } from "@/lib/sports/sport-id";
import type { SportModule } from "@/lib/sports/types";

const SPORT_MODULES: Record<SportId, SportModule> = {
  VOLLEYBALL: volleyballSportModule,
  SOCCER: soccerSportModule,
  BASKETBALL: basketballSportModule,
};

/** 依運動 ID 取得外掛模組（註解：client／server 皆可呼叫）。 */
export function getSportModule(sport: SportId): SportModule {
  return SPORT_MODULES[sport];
}
