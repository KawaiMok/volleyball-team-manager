import type { SportModule } from "@/lib/sports/types";
import { basketballCourtModule } from "@/lib/sports/basketball/court/config";
import { basketballMatchModule } from "@/lib/sports/basketball/match";
import { soccerCourtModule } from "@/lib/sports/soccer/court/config";
import { soccerMatchModule } from "@/lib/sports/soccer/match";
import { volleyballCourtModule } from "@/lib/sports/volleyball/court/config";
import { volleyballMatchModule } from "@/lib/sports/volleyball/match/index";

/** 排球（註解：無 Prisma import，可供 client bundle 使用）。 */
export const volleyballSportModule: SportModule = {
  id: "VOLLEYBALL",
  labels: {
    name: "排球",
    positionPlaceholder: "例如：舉球員、自由球員",
  },
  capabilities: {
    courtSketch: true,
    liveTactical: true,
    matchStats: true,
  },
  court: volleyballCourtModule,
  match: volleyballMatchModule,
};

/** 足球（註解：11v11 戰術板 + 比賽統計）。 */
export const soccerSportModule: SportModule = {
  id: "SOCCER",
  labels: {
    name: "足球",
    positionPlaceholder: "例如：前鋒、中場、後衛、守門",
  },
  capabilities: {
    courtSketch: true,
    liveTactical: true,
    matchStats: true,
  },
  court: soccerCourtModule,
  match: soccerMatchModule,
};

/** 籃球（註解：5v5 戰術板 + 比賽統計）。 */
export const basketballSportModule: SportModule = {
  id: "BASKETBALL",
  labels: {
    name: "籃球",
    positionPlaceholder: "例如：控球、得分後衛、小前鋒、中鋒",
  },
  capabilities: {
    courtSketch: true,
    liveTactical: true,
    matchStats: true,
  },
  court: basketballCourtModule,
  match: basketballMatchModule,
};
