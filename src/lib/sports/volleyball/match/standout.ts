import { formatRating } from "@/lib/sports/match/metrics";
import { perMatchAvg } from "@/lib/sports/match/standout";
import type { PlayerStatsRecord, StandoutLeaderDef } from "@/lib/sports/match/types";

function computePassRating(stats: PlayerStatsRecord): number | null {
  const p = stats.pass;
  if (!p) return null;
  const total = (p.perfect ?? 0) + (p.good ?? 0) + (p.poor ?? 0) + (p.aced ?? 0);
  if (total <= 0) return null;
  return (
    (p.perfect ?? 0) * 3 + (p.good ?? 0) * 2 + (p.poor ?? 0) + (p.aced ?? 0) * -1
  ) / total;
}

/** 排球：表現突出榜單 */
export const VOLLEYBALL_STANDOUT_LEADERS: readonly StandoutLeaderDef[] = [
  {
    key: "scoringPerMatch",
    title: "場均得分王",
    subtitle: "攻擊＋攔網＋發球 ACE",
    compute: (stats, matchCount) => {
      const total =
        (stats.attack?.points ?? 0) + (stats.block?.points ?? 0) + (stats.serve?.aces ?? 0);
      return perMatchAvg(total, matchCount);
    },
    formatValue: (v) => v.toFixed(2),
  },
  {
    key: "passKing",
    title: "一傳王",
    subtitle: "一傳 rating",
    compute: (stats) => computePassRating(stats),
    formatValue: (v) => formatRating(v),
  },
  {
    key: "blockPerMatch",
    title: "攔網王",
    subtitle: "場均攔網得分",
    compute: (stats, matchCount) => perMatchAvg(stats.block?.points ?? 0, matchCount),
    formatValue: (v) => v.toFixed(2),
  },
  {
    key: "acePerMatch",
    title: "發球 ACE 王",
    subtitle: "場均 ACE",
    compute: (stats, matchCount) => perMatchAvg(stats.serve?.aces ?? 0, matchCount),
    formatValue: (v) => v.toFixed(2),
  },
  {
    key: "defensePerMatch",
    title: "防守王",
    subtitle: "場均防守成功",
    compute: (stats, matchCount) => perMatchAvg(stats.defense?.success ?? 0, matchCount),
    formatValue: (v) => v.toFixed(2),
  },
];
