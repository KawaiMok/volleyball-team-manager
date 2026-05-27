"use client";

import { MatchPlayerStatsTables } from "@/components/match-player-stats-tables";
import {
  computeSetWins,
  MATCH_TEAM_STAT_LABELS,
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
  /** 高亮當前球員（註解：球員端唯讀）。 */
  highlightMemberId?: string;
};

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
        <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{value}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-[var(--brand-primary)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** 比賽結果可視化（註解：比分、球隊與六大類個人數據）。 */
export function MatchResultVisualization({ data, teamName = "我方", highlightMemberId }: Props) {
  const { our: setsWonOur, opponent: setsWonOpp } = computeSetWins(data.sets);
  const won = setsWonOur > setsWonOpp;
  const tied = setsWonOur === setsWonOpp;

  const teamStatEntries = Object.entries(data.teamStats ?? {}).filter(
    ([, v]) => typeof v === "number" && v > 0,
  ) as [keyof MatchTeamStats, number][];
  const teamStatMax = Math.max(...teamStatEntries.map(([, v]) => v), 1);

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
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {data.opponentName?.trim() || "對手"}
            </p>
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
      </div>

      {/* 球隊數據 */}
      {teamStatEntries.length > 0 ?
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">球隊數據</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {teamStatEntries.map(([key, value]) => (
              <StatBar key={key} label={MATCH_TEAM_STAT_LABELS[key]} value={value} max={teamStatMax} />
            ))}
          </div>
        </div>
      : null}

      {/* 個人數據：六大分類 */}
      {data.playerStats.length > 0 ?
        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">個人數據</h3>
          <MatchPlayerStatsTables playerStats={data.playerStats} highlightMemberId={highlightMemberId} />
        </div>
      : null}

      {data.notes ?
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-xs font-semibold uppercase text-zinc-500">備註</p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{data.notes}</p>
        </div>
      : null}
    </div>
  );
}
