"use client";

import { useMemo, useState } from "react";

import { MatchPlayerStatsTables, type PlayerStatsRow } from "@/components/match-player-stats-tables";
import { useMatchModule } from "@/components/team-sport-provider";
import type { PlayerStatsRecord } from "@/lib/sports/match/types";

type Mode = "total" | "avg";

function scaleStats(
  stats: PlayerStatsRecord,
  divisor: number,
  categories: readonly string[],
  categoryFields: Record<string, { key: string }[]>,
): PlayerStatsRecord {
  if (!Number.isFinite(divisor) || divisor <= 0) return stats;
  const out: PlayerStatsRecord = { ...stats };
  for (const cat of categories) {
    const c = out[cat] as Record<string, number> | undefined;
    if (!c) continue;
    const next: Record<string, number> = {};
    for (const f of categoryFields[cat] ?? []) {
      if (f.key.startsWith("_")) continue;
      const v = c[f.key];
      if (typeof v !== "number") continue;
      next[f.key] = Math.round((v / divisor) * 100) / 100;
    }
    if (Object.keys(next).length > 0) out[cat] = next;
  }
  return out;
}

export function MatchStatsTotalsToggle({
  rows,
}: {
  rows: Array<PlayerStatsRow & { matchCount: number }>;
}) {
  const match = useMatchModule();
  const [mode, setMode] = useState<Mode>("total");

  const viewRows = useMemo(() => {
    if (mode === "total") return rows;
    return rows.map((r) => ({
      ...r,
      stats: scaleStats(r.stats, r.matchCount, match.categories, match.categoryFields),
    }));
  }, [rows, mode, match]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">顯示</span>
          <div className="inline-flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setMode("total")}
              className={
                mode === "total" ?
                  "bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300"
              }
            >
              總數
            </button>
            <button
              type="button"
              onClick={() => setMode("avg")}
              className={
                mode === "avg" ?
                  "bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300"
              }
            >
              場均
            </button>
          </div>
        </div>
        {mode === "avg" ?
          <p className="text-xs text-zinc-500">場均分母＝該球員「有填個人數據」的比賽場次數</p>
        : null}
      </div>

      <MatchPlayerStatsTables playerStats={viewRows} />
    </div>
  );
}
