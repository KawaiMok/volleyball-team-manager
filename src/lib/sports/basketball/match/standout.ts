import { perMatchAvg } from "@/lib/sports/match/standout";
import type { StandoutLeaderDef } from "@/lib/sports/match/types";

/** 籃球：表現突出榜單 */
export const BASKETBALL_STANDOUT_LEADERS: readonly StandoutLeaderDef[] = [
  {
    key: "pointsPerMatch",
    title: "場均得分王",
    subtitle: "場均得分",
    compute: (stats, matchCount) => perMatchAvg(stats.scoring?.points ?? 0, matchCount),
    formatValue: (v) => v.toFixed(1),
  },
  {
    key: "assistsPerMatch",
    title: "助攻王",
    subtitle: "場均助攻",
    compute: (stats, matchCount) => perMatchAvg(stats.playmaking?.assists ?? 0, matchCount),
    formatValue: (v) => v.toFixed(1),
  },
  {
    key: "reboundsPerMatch",
    title: "籃板王",
    subtitle: "場均籃板",
    compute: (stats, matchCount) => {
      const total = (stats.rebounding?.offensiveReb ?? 0) + (stats.rebounding?.defensiveReb ?? 0);
      return perMatchAvg(total, matchCount);
    },
    formatValue: (v) => v.toFixed(1),
  },
  {
    key: "stealsPerMatch",
    title: "抄截王",
    subtitle: "場均抄截",
    compute: (stats, matchCount) => perMatchAvg(stats.defense?.steals ?? 0, matchCount),
    formatValue: (v) => v.toFixed(1),
  },
];
