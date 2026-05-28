"use client";

import { useMemo, useState } from "react";

import { MatchPlayerStatsTables, type PlayerStatsRow } from "@/components/match-player-stats-tables";
import { type PlayerMatchStats, STAT_CATEGORIES } from "@/lib/match-result-schema";

type Mode = "total" | "avg";

function scaleStats(stats: PlayerMatchStats, divisor: number): PlayerMatchStats {
  if (!Number.isFinite(divisor) || divisor <= 0) return stats;
  const out: PlayerMatchStats = { ...stats };
  for (const cat of STAT_CATEGORIES) {
    const c = out[cat] as Record<string, number> | undefined;
    if (!c) continue;
    const next: Record<string, number> = {};
    for (const [k, v] of Object.entries(c)) {
      if (typeof v !== "number") continue;
      /** 註解：場均保留兩位小數，避免全是整數導致資訊不足。 */
      next[k] = Math.round((v / divisor) * 100) / 100;
    }
    (out as Record<string, unknown>)[cat] = next;
  }
  return out;
}

export function MatchStatsTotalsToggle({
  rows,
}: {
  rows: Array<PlayerStatsRow & { matchCount: number }>;
}) {
  const [mode, setMode] = useState<Mode>("total");

  const viewRows = useMemo(() => {
    if (mode === "total") return rows;
    return rows.map((r) => ({
      ...r,
      stats: scaleStats(r.stats, r.matchCount),
    }));
  }, [rows, mode]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">顯示</span>
          <div className="inline-flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setMode("total")}
              className={
                mode === "total" ?
                  "bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-950"
              }
              aria-pressed={mode === "total"}
            >
              總數
            </button>
            <button
              type="button"
              onClick={() => setMode("avg")}
              className={
                mode === "avg" ?
                  "bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-white px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-950"
              }
              aria-pressed={mode === "avg"}
            >
              場均
            </button>
          </div>
        </div>
        {mode === "avg" ?
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            註解：場均分母＝該球員「有填個人數據」的比賽場次數
          </p>
        : null}
      </div>

      <MatchPlayerStatsTables playerStats={viewRows} />
    </div>
  );
}

