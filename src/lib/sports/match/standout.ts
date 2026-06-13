import type { PlayerStatsRecord, StandoutLeaderDef } from "@/lib/sports/match/types";

export type StandoutPlayerRow = {
  memberId: string;
  displayName: string;
  jerseyNumber: number | null;
  matchCount: number;
  stats: PlayerStatsRecord;
};

export type StandoutWinner = {
  key: string;
  title: string;
  subtitle?: string;
  memberId: string;
  displayName: string;
  jerseyNumber: number | null;
  matchCount: number;
  value: number;
  formattedValue: string;
};

export type StandoutCard = StandoutWinner | {
  key: string;
  title: string;
  subtitle?: string;
  empty: true;
};

/** 場均值（註解：matchCount ≤ 0 回傳 null）。 */
export function perMatchAvg(total: number, matchCount: number): number | null {
  if (!Number.isFinite(matchCount) || matchCount <= 0 || total <= 0) return null;
  return Math.round((total / matchCount) * 100) / 100;
}

/** 各榜單取最高者（註解：同分保留先出現者）。 */
export function computeStandoutWinners(
  leaders: readonly StandoutLeaderDef[],
  rows: StandoutPlayerRow[],
): StandoutCard[] {
  return leaders.map((leader) => {
    let best: StandoutPlayerRow | null = null;
    let bestValue: number | null = null;

    for (const row of rows) {
      const value = leader.compute(row.stats, row.matchCount);
      if (value == null || !Number.isFinite(value)) continue;
      if (bestValue == null || value > bestValue) {
        bestValue = value;
        best = row;
      }
    }

    if (best == null || bestValue == null) {
      return { key: leader.key, title: leader.title, subtitle: leader.subtitle, empty: true as const };
    }

    return {
      key: leader.key,
      title: leader.title,
      subtitle: leader.subtitle,
      memberId: best.memberId,
      displayName: best.displayName,
      jerseyNumber: best.jerseyNumber,
      matchCount: best.matchCount,
      value: bestValue,
      formattedValue: leader.formatValue(bestValue),
    };
  });
}
