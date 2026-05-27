"use client";

import type { PlayerStatsRow } from "@/components/match-player-stats-tables";
import { CATEGORY_FIELDS } from "@/lib/match-player-stats-fields";
import {
  MATCH_TEAM_STAT_LABELS,
  STAT_CATEGORY_LABELS,
  hasCategoryData,
  type MatchSetScore,
  type MatchTeamStats,
  type PlayerMatchStats,
  type StatCategory,
} from "@/lib/match-result-schema";

/** 單一數值橫條（註解：可視化圖表基礎元件）。 */
export function MetricBar({
  label,
  value,
  max,
  className = "bg-[var(--brand-primary)]",
}: {
  label: string;
  value: number;
  max: number;
  className?: string;
}) {
  const width = max > 0 ? Math.max(value > 0 ? 8 : 0, (value / max) * 100) : 0;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 truncate text-zinc-500 dark:text-zinc-400" title={label}>
        {label}
      </span>
      <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full rounded-full transition-all ${className}`} style={{ width: `${width}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{value}</span>
    </div>
  );
}

/** 各局比分柱狀圖（註解：我方 vs 對手）。 */
export function MatchSetScoreChart({
  sets,
  teamName,
  opponentName,
}: {
  sets: MatchSetScore[];
  teamName: string;
  opponentName: string;
}) {
  const max = Math.max(...sets.flatMap((s) => [s.our, s.opponent]), 1);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">各局得分</p>
      <div className="flex items-end justify-center gap-3">
        {sets.map((s, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-28 w-full items-end justify-center gap-1">
              <div
                className="w-5 rounded-t bg-[var(--brand-primary)]"
                style={{ height: `${Math.max(8, (s.our / max) * 100)}%` }}
                title={`${teamName} ${s.our}`}
              />
              <div
                className="w-5 rounded-t bg-zinc-400 dark:bg-zinc-600"
                style={{ height: `${Math.max(8, (s.opponent / max) * 100)}%` }}
                title={`${opponentName} ${s.opponent}`}
              />
            </div>
            <span className="text-[10px] tabular-nums text-zinc-500">第{i + 1}局</span>
            <span className="text-[10px] tabular-nums text-zinc-400">
              {s.our}-{s.opponent}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-[var(--brand-primary)]" />
          {teamName}
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-zinc-400 dark:bg-zinc-600" />
          {opponentName}
        </span>
      </div>
    </div>
  );
}

/** 球隊整體數據柱狀圖。 */
export function MatchTeamStatsChart({ teamStats }: { teamStats: MatchTeamStats | null }) {
  if (!teamStats) return null;

  const entries = (Object.keys(MATCH_TEAM_STAT_LABELS) as Array<keyof typeof MATCH_TEAM_STAT_LABELS>)
    .map((key) => ({ key, label: MATCH_TEAM_STAT_LABELS[key], value: teamStats[key] ?? 0 }))
    .filter((e) => e.value > 0);

  if (entries.length === 0) return null;

  const max = Math.max(...entries.map((e) => e.value), 1);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">球隊數據</p>
      {entries.map((e) => (
        <MetricBar key={e.key} label={e.label} value={e.value} max={max} />
      ))}
    </div>
  );
}

/** 單一球員、單一分類的欄位圖表。 */
export function PersonalCategoryChart({
  stats,
  category,
}: {
  stats: PlayerMatchStats;
  category: StatCategory;
}) {
  if (!hasCategoryData(stats, category)) return null;

  const fields = CATEGORY_FIELDS[category].filter((f) => !f.derived);
  const cat = stats[category] as Record<string, number>;
  const values = fields.map((f) => cat[f.key] ?? 0);
  const max = Math.max(...values, 1);

  return (
    <div className="space-y-2">
      {fields.map((f) => (
        <MetricBar key={f.key} label={f.label} value={cat[f.key] ?? 0} max={max} />
      ))}
    </div>
  );
}

function CategoryPlayerChart({
  category,
  rows,
  highlightMemberId,
}: {
  category: StatCategory;
  rows: PlayerStatsRow[];
  highlightMemberId?: string;
}) {
  const filtered = rows.filter((r) => hasCategoryData(r.stats, category));
  if (filtered.length === 0) return null;

  const fields = CATEGORY_FIELDS[category].filter((f) => !f.derived);
  let max = 1;
  for (const r of filtered) {
    const cat = r.stats[category] as Record<string, number>;
    for (const f of fields) {
      max = Math.max(max, cat[f.key] ?? 0);
    }
  }

  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
        {STAT_CATEGORY_LABELS[category]}
      </h4>
      <div className="space-y-4">
        {filtered.map((r) => {
          const hl = r.memberId === highlightMemberId;
          const cat = r.stats[category] as Record<string, number>;
          return (
            <div
              key={r.memberId}
              className={`rounded-lg border p-3 ${hl ? "border-[var(--brand-primary)]/40 bg-[var(--brand-primary)]/5" : "border-zinc-200 dark:border-zinc-800"}`}
            >
              <p className={`mb-2 text-sm font-medium ${hl ? "text-[var(--brand-primary)]" : "text-zinc-900 dark:text-zinc-50"}`}>
                {r.displayName}
              </p>
              <div className="space-y-1.5">
                {fields.map((f) => (
                  <MetricBar key={f.key} label={f.label} value={cat[f.key] ?? 0} max={max} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 全隊個人數據圖表（註解：六大分類）。 */
export function MatchPlayerStatsCharts({
  playerStats,
  highlightMemberId,
}: {
  playerStats: PlayerStatsRow[];
  highlightMemberId?: string;
}) {
  const categories = (Object.keys(STAT_CATEGORY_LABELS) as StatCategory[]).filter((c) =>
    playerStats.some((p) => hasCategoryData(p.stats, c)),
  );

  if (categories.length === 0) return null;

  return (
    <div className="space-y-6">
      {categories.map((c) => (
        <CategoryPlayerChart
          key={c}
          category={c}
          rows={playerStats}
          highlightMemberId={highlightMemberId}
        />
      ))}
    </div>
  );
}

/** 球員端：我的數據圖表卡片。 */
export function PersonalStatsChartGrid({ stats }: { stats: PlayerMatchStats }) {
  const categories = (Object.keys(STAT_CATEGORY_LABELS) as StatCategory[]).filter((c) =>
    hasCategoryData(stats, c),
  );

  if (categories.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((c) => (
        <div
          key={c}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-zinc-900"
        >
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {STAT_CATEGORY_LABELS[c]}
          </h4>
          <div className="mt-3">
            <PersonalCategoryChart stats={stats} category={c} />
          </div>
        </div>
      ))}
    </div>
  );
}
