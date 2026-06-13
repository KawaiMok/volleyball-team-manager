import { perMatchAvg } from "@/lib/sports/match/standout";
import type { StandoutLeaderDef } from "@/lib/sports/match/types";

/** 足球：表現突出榜單 */
export const SOCCER_STANDOUT_LEADERS: readonly StandoutLeaderDef[] = [
  {
    key: "goalsPerMatch",
    title: "進球王",
    subtitle: "場均進球",
    compute: (stats, matchCount) => perMatchAvg(stats.attack?.goals ?? 0, matchCount),
    formatValue: (v) => v.toFixed(2),
  },
  {
    key: "assistsPerMatch",
    title: "助攻王",
    subtitle: "場均助攻",
    compute: (stats, matchCount) => perMatchAvg(stats.attack?.assists ?? 0, matchCount),
    formatValue: (v) => v.toFixed(2),
  },
  {
    key: "savesPerMatch",
    title: "撲救王",
    subtitle: "場均撲救",
    compute: (stats, matchCount) => perMatchAvg(stats.goalkeeping?.saves ?? 0, matchCount),
    formatValue: (v) => v.toFixed(2),
  },
  {
    key: "tacklesPerMatch",
    title: "搶斷王",
    subtitle: "場均搶斷",
    compute: (stats, matchCount) => perMatchAvg(stats.defense?.tackles ?? 0, matchCount),
    formatValue: (v) => v.toFixed(2),
  },
];
