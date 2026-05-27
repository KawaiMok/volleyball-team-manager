"use client";

import { DataViewModeToggle } from "@/components/data-view-mode-toggle";
import { useDataViewMode } from "@/components/data-view-mode-provider";
import { MatchPlayerStatsCharts, MatchSetScoreChart, MatchTeamStatsChart } from "@/components/match-stats-charts";
import { MatchPlayerStatsTables } from "@/components/match-player-stats-tables";
import { MatchTeamStatsViewSection } from "@/components/match-team-stats-section";
import {
  computeSetWins,
  type MatchSetScore,
  type MatchTeamStats,
  type PlayerMatchStats,
} from "@/lib/match-result-schema";

export type MatchResultViewData = {
  opponentName: string | null;
  sets: MatchSetScore[];
  teamStats: MatchTeamStats | null;
  notes: string | null;
  playerStats: Array<{
    memberId: string;
    displayName: string;
    stats: PlayerMatchStats;
  }>;
};

type Props = {
  data: MatchResultViewData;
  teamName?: string;
  /** 高亮當前球員（註解：教練端全隊表）。 */
  highlightMemberId?: string;
  /** 僅顯示大比分（註解：球員端不顯示球隊／全隊個人表）。 */
  scoreOnly?: boolean;
  /** 隱藏區塊內的檢視切換（註解：外層已有切換時）。 */
  hideViewToggle?: boolean;
};

/** 比賽結果可視化（註解：支援表格／圖表檢視模式）。 */
export function MatchResultVisualization({
  data,
  teamName = "我方",
  highlightMemberId,
  scoreOnly = false,
  hideViewToggle = false,
}: Props) {
  const { mode } = useDataViewMode();
  const { our: setsWonOur, opponent: setsWonOpp } = computeSetWins(data.sets);
  const won = setsWonOur > setsWonOpp;
  const tied = setsWonOur === setsWonOpp;
  const opponentLabel = data.opponentName?.trim() || "對手";

  return (
    <div className="space-y-6">
      {/* 比分總覽 */}
      <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-5 dark:border-zinc-700 dark:from-zinc-900 dark:to-zinc-950">
        <p className="text-center text-xs font-medium uppercase tracking-wide text-zinc-500">比賽結果</p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{teamName}</p>
            <p className="text-4xl font-bold tabular-nums text-[var(--brand-primary)]">{setsWonOur}</p>
          </div>
          <span className="text-2xl font-light text-zinc-400">:</span>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{opponentLabel}</p>
            <p className="text-4xl font-bold tabular-nums text-zinc-700 dark:text-zinc-200">{setsWonOpp}</p>
          </div>
        </div>
        {!tied ?
          <p
            className={`mt-2 text-center text-sm font-semibold ${won ? "text-emerald-600" : "text-amber-600"}`}
          >
            {won ? "勝" : "負"}
          </p>
        : (
          <p className="mt-2 text-center text-sm font-semibold text-zinc-500">平</p>
        )}
        {mode === "chart" ?
          <div className="mt-4">
            <MatchSetScoreChart sets={data.sets} teamName={teamName} opponentName={opponentLabel} />
          </div>
        : (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {data.sets.map((s, i) => (
              <span
                key={i}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium tabular-nums shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700"
              >
                第{i + 1}局 {s.our}-{s.opponent}
              </span>
            ))}
          </div>
        )}
      </div>

      {scoreOnly ? null : (
        <>
          {!hideViewToggle ?
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">比賽數據</h3>
              <DataViewModeToggle />
            </div>
          : null}

          {mode === "chart" ?
            <>
              {data.teamStats ?
                <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
                  <MatchTeamStatsChart teamStats={data.teamStats} />
                </div>
              : null}
              {data.playerStats.length > 0 ?
                <MatchPlayerStatsCharts
                  playerStats={data.playerStats}
                  highlightMemberId={highlightMemberId}
                />
              : null}
            </>
          : (
            <>
              <MatchTeamStatsViewSection teamStats={data.teamStats} />
              {data.playerStats.length > 0 ?
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">個人數據</h3>
                  <MatchPlayerStatsTables
                    playerStats={data.playerStats}
                    highlightMemberId={highlightMemberId}
                  />
                </div>
              : null}
            </>
          )}

          {data.notes ?
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-xs font-semibold uppercase text-zinc-500">備註</p>
              <p className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{data.notes}</p>
            </div>
          : null}
        </>
      )}
    </div>
  );
}
