"use client";

import type { PlayerStatsRow } from "@/components/match-player-stats-tables";
import { useMatchModule } from "@/components/team-sport-provider";
import {
  computeAdjustedRating,
  DEFAULT_MIN_SAMPLE,
  formatMetricChartValue,
  shrinkRating,
  ratingPrior,
  DEFAULT_SHRINK_STRENGTH,
} from "@/lib/sports/match/metrics";
import type { PeriodScore, PlayerStatsRecord } from "@/lib/sports/match/types";
import { useEffect, useMemo, useState } from "react";

/** 單一數值橫條（註解：線性比例，移除最小寬度避免壓縮差異）。 */
export function MetricBar({
  label,
  value,
  max,
  min = 0,
  className = "bg-[var(--brand-primary)]",
  formatValue,
  hint,
}: {
  label: string;
  value: number;
  max: number;
  min?: number;
  className?: string;
  formatValue?: (v: number) => string;
  hint?: string;
}) {
  const range = max - min;
  const width = range > 0 ? Math.min(100, Math.max(0, ((value - min) / range) * 100)) : 0;
  const display = formatValue ? formatValue(value) : formatMetricChartValue(value);

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 truncate text-zinc-500 dark:text-zinc-400" title={label}>
        {label}
      </span>
      <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full rounded-full transition-all ${className}`} style={{ width: `${width}%` }} />
      </div>
      <span className="w-14 shrink-0 text-right tabular-nums text-zinc-700 dark:text-zinc-300" title={hint}>
        {display}
      </span>
    </div>
  );
}

/** 各段比分柱狀圖（註解：我方 vs 對手）。 */
export function MatchPeriodScoreChart({
  periods,
  teamName,
  opponentName,
}: {
  periods: PeriodScore[];
  teamName: string;
  opponentName: string;
}) {
  const match = useMatchModule();
  const max = Math.max(...periods.flatMap((s) => [s.our, s.opponent]), 1);

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{match.score.periodsSectionTitle}</p>
      <div className="flex items-end justify-center gap-3">
        {periods.map((s, i) => (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1">
            <div className="flex h-28 w-full items-end justify-center gap-1">
              <div
                className="w-5 rounded-t bg-[var(--brand-primary)]"
                style={{ height: `${(s.our / max) * 100}%` }}
                title={`${teamName} ${s.our}`}
              />
              <div
                className="w-5 rounded-t bg-zinc-400 dark:bg-zinc-600"
                style={{ height: `${(s.opponent / max) * 100}%` }}
                title={`${opponentName} ${s.opponent}`}
              />
            </div>
            <span className="text-[10px] tabular-nums text-zinc-500">{match.score.periodLabel(i)}</span>
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

/** @deprecated 向後相容別名 */
export const MatchSetScoreChart = MatchPeriodScoreChart;

/** 球隊整體數據柱狀圖。 */
export function MatchTeamStatsChart({
  teamStats,
}: {
  teamStats: Record<string, number | undefined> | null;
}) {
  const match = useMatchModule();
  if (!teamStats) return null;

  const entries = match.teamStatKeys
    .map((key) => ({ key, label: match.teamStatLabels[key], value: teamStats[key] ?? 0 }))
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

/** 單一球員、單一分類的欄位圖表（註解：各欄位獨立比例，避免次數差異壓縮小項）。 */
export function PersonalCategoryChart({
  stats,
  category,
  teamRows,
}: {
  stats: PlayerStatsRecord;
  category: string;
  teamRows?: PlayerStatsRow[];
}) {
  const match = useMatchModule();
  if (!match.hasCategoryData(stats, category)) return null;

  const fields = (match.categoryFields[category] ?? []).filter((f) => !f.derived);
  const cat = stats[category] as Record<string, number>;

  return (
    <div className="space-y-2">
      {fields.map((f) => {
        const value = cat[f.key] ?? 0;
        const teamMax =
          teamRows?.length ?
            Math.max(
              ...teamRows.map((r) => match.getFieldNumericValue(r.stats, category, f.key) ?? 0),
              value,
              1,
            )
          : Math.max(value, 1);
        return (
          <MetricBar key={f.key} label={f.label} value={value} max={teamMax} />
        );
      })}
    </div>
  );
}

function CategoryTabs({
  active,
  categories,
  labels,
  onChange,
  className = "",
}: {
  active: string;
  categories: readonly string[];
  labels: Record<string, string>;
  onChange: (tab: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {categories.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            active === c ?
              "bg-[var(--brand-primary)] text-white"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {labels[c] ?? c}
        </button>
      ))}
    </div>
  );
}

type MetricOption = {
  id: string;
  category: string;
  fieldKey: string;
  label: string;
  isPercent: boolean;
  isRating: boolean;
};

function isPercentDerived(derived?: string): boolean {
  return derived === "attackScore" || derived === "attackError" || derived === "defenseRate" || derived === "trueShooting";
}

/** 衍生 rating 欄位對應的 rating 定義 */
function derivedRatingDef(
  match: ReturnType<typeof useMatchModule>,
  derived?: string,
) {
  if (!derived || isPercentDerived(derived)) return undefined;
  const derivedToRating: Record<string, string> = {
    blockRating: "blockRating",
    passRating: "passRating",
    serveRating: "serveRating",
    reboundRating: "reboundRating",
    playmakingRating: "playmakingRating",
    defenseRating: "defenseRating",
    attackRating: "attackRating",
    passingRating: "passingRating",
    goalkeepingRating: "goalkeepingRating",
  };
  const ratingKey = derivedToRating[derived];
  return ratingKey ? match.ratings.find((r) => r.key === ratingKey) : undefined;
}

/** 單一分類：把所有球員合在同一區塊比較。 */
function CombinedCategoryComparisonChart({
  category,
  rows,
  highlightMemberId,
}: {
  category: string;
  rows: PlayerStatsRow[];
  highlightMemberId?: string;
}) {
  const match = useMatchModule();
  const filtered = useMemo(
    () => rows.filter((r) => match.hasCategoryData(r.stats, category)),
    [rows, category, match],
  );
  if (filtered.length === 0) return null;

  const fields = match.categoryFields[category] ?? [];

  return (
    <div className="space-y-4">
      {fields.map((f) => {
        const values = filtered.map((r) => {
          const raw = match.getFieldNumericValue(r.stats, category, f.key);
          const sampleSize = match.getFieldSampleSize(r.stats, category, f.key);
          let value = raw;
          if (f.derived && raw != null && sampleSize > 0) {
            const prior = isPercentDerived(f.derived) ? 0.5 : ratingPrior(0, 1);
            value = shrinkRating(raw, sampleSize, prior, DEFAULT_SHRINK_STRENGTH);
          }
          return {
            ...r,
            value: value ?? 0,
            raw,
            sampleSize,
            lowSample: sampleSize > 0 && sampleSize < DEFAULT_MIN_SAMPLE,
          };
        });
        const nums = values.map((v) => v.value).filter((n) => n > 0);
        if (nums.length === 0) return null;

        const ratingDef = derivedRatingDef(match, f.derived);
        const dataMax = Math.max(...nums);
        const asPercent = f.derived ? isPercentDerived(f.derived) : false;
        const max = ratingDef ? ratingDef.normMax : asPercent ? 1 : dataMax;
        const baseline = 0;
        const sorted = [...values].sort((a, b) => b.value - a.value);

        return (
          <div key={f.key} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{f.label}</p>
              <p className="text-[10px] text-zinc-400">
                最高 {formatMetricChartValue(dataMax, asPercent)}
              </p>
            </div>
            <div className="space-y-1.5">
              {sorted.map((r) => {
                const hl = r.memberId === highlightMemberId;
                return (
                  <div
                    key={r.memberId}
                    className={`rounded-md px-1 py-0.5 ${hl ? "bg-[var(--brand-primary)]/5" : ""}`}
                  >
                    <MetricBar
                      label={r.displayName}
                      value={r.value}
                      max={max}
                      min={baseline}
                      className={hl ? "bg-[var(--brand-primary)]" : "bg-zinc-400 dark:bg-zinc-600"}
                      formatValue={(v) => formatMetricChartValue(v, asPercent)}
                      hint={
                        r.lowSample ?
                          `樣本 ${r.sampleSize}（已收縮調整，樣本偏少）`
                        : r.sampleSize > 0 ?
                          `樣本 ${r.sampleSize}`
                        : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 自選球員 × 指標比較（註解：可篩選同位置）。 */
function PlayerMetricComparisonChart({
  rows,
  highlightMemberId,
}: {
  rows: PlayerStatsRow[];
  highlightMemberId?: string;
}) {
  const match = useMatchModule();
  const metricOptions = useMemo<MetricOption[]>(() => {
    const options: MetricOption[] = [];
    for (const c of match.categories) {
      for (const f of match.categoryFields[c] ?? []) {
        options.push({
          id: `${c}:${f.key}`,
          category: c,
          fieldKey: f.key,
          label: `${match.categoryLabels[c]} · ${f.label}`,
          isPercent: isPercentDerived(f.derived),
          isRating: Boolean(f.derived),
        });
      }
    }
    for (const r of match.ratings) {
      options.push({
        id: `rating:${r.key}`,
        category: "",
        fieldKey: r.key,
        label: `${r.label} rating`,
        isPercent: false,
        isRating: true,
      });
    }
    return options;
  }, [match]);

  const playersWithData = useMemo(
    () => rows.filter((r) => match.hasAnyPlayerStats(r.stats)),
    [rows, match],
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (highlightMemberId && playersWithData.some((p) => p.memberId === highlightMemberId)) {
      return [highlightMemberId];
    }
    return playersWithData.slice(0, 2).map((p) => p.memberId);
  });
  const [metricId, setMetricId] = useState(metricOptions[0]?.id ?? "");
  const [samePositionOnly, setSamePositionOnly] = useState(false);

  const anchorId = highlightMemberId ?? selectedIds[0] ?? "";
  const anchor = playersWithData.find((p) => p.memberId === anchorId);

  useEffect(() => {
    if (selectedIds.length > 0) return;
    if (highlightMemberId && playersWithData.some((p) => p.memberId === highlightMemberId)) {
      setSelectedIds([highlightMemberId]);
      return;
    }
    if (playersWithData.length > 0) {
      setSelectedIds(playersWithData.slice(0, 2).map((p) => p.memberId));
    }
  }, [highlightMemberId, playersWithData, selectedIds.length]);

  const visiblePlayers = useMemo(() => {
    if (!samePositionOnly || !anchor?.position?.trim()) return playersWithData;
    const pos = anchor.position.trim();
    return playersWithData.filter((p) => (p.position?.trim() || "") === pos);
  }, [playersWithData, samePositionOnly, anchor?.position]);

  const metric = metricOptions.find((m) => m.id === metricId) ?? metricOptions[0];
  if (!metric || playersWithData.length === 0) return null;

  const compared = selectedIds
    .map((id) => playersWithData.find((p) => p.memberId === id))
    .filter((p): p is PlayerStatsRow => p != null);

  const bars = compared.map((row) => {
    if (metric.id.startsWith("rating:")) {
      const def = match.ratings.find((r) => r.key === metric.fieldKey);
      if (!def) return { row, value: 0, sampleSize: 0, lowSample: false };
      const { adjusted, sampleSize, lowSample } = computeAdjustedRating(def, row.stats);
      return { row, value: adjusted ?? 0, sampleSize, lowSample };
    }
    const raw = match.getFieldNumericValue(row.stats, metric.category, metric.fieldKey);
    const sampleSize = match.getFieldSampleSize(row.stats, metric.category, metric.fieldKey);
    let value = raw ?? 0;
    if (metric.isRating && raw != null && sampleSize > 0) {
      const prior = metric.isPercent ? 0.5 : ratingPrior(0, 1);
      value = shrinkRating(raw, sampleSize, prior, DEFAULT_SHRINK_STRENGTH) ?? 0;
    }
    return {
      row,
      value,
      sampleSize,
      lowSample: sampleSize > 0 && sampleSize < DEFAULT_MIN_SAMPLE,
    };
  });

  const nums = bars.map((b) => b.value);
  const dataMax = nums.length > 0 ? Math.max(...nums) : 0;
  let max = Math.max(dataMax, 1);
  const baseline = 0;

  if (metric.id.startsWith("rating:")) {
    const def = match.ratings.find((r) => r.key === metric.fieldKey);
    if (def) max = def.normMax;
  } else if (metric.isPercent) {
    max = 1;
  } else if (metric.isRating) {
    const fieldDef = match.categoryFields[metric.category]?.find((f) => f.key === metric.fieldKey);
    const def = derivedRatingDef(match, fieldDef?.derived);
    if (def) max = def.normMax;
  } else {
    max = Math.max(dataMax, 1);
  }

  function togglePlayer(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-zinc-500">比較指標</span>
          <select
            value={metric.id}
            onChange={(e) => setMetricId(e.target.value)}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {metricOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        {anchor?.position ?
          <label className="flex items-center gap-2 pb-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={samePositionOnly}
              onChange={(e) => setSamePositionOnly(e.target.checked)}
              className="rounded border-zinc-300"
            />
            僅顯示同位置（{anchor.position}）
          </label>
        : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {visiblePlayers.map((p) => {
          const on = selectedIds.includes(p.memberId);
          const hl = p.memberId === highlightMemberId;
          return (
            <button
              key={p.memberId}
              type="button"
              onClick={() => togglePlayer(p.memberId)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                on ?
                  hl ?
                    "bg-[var(--brand-primary)] text-white ring-2 ring-[var(--brand-primary)]/30"
                  : "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {p.displayName}
              {p.position ? <span className="ml-1 opacity-70">· {p.position}</span> : null}
            </button>
          );
        })}
      </div>

      {compared.length === 0 ?
        <p className="text-sm text-zinc-500">請選擇至少一位球員。</p>
      : (
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <p className="mb-2 text-xs font-semibold text-zinc-500">{metric.label}</p>
          <div className="space-y-1.5">
            {[...bars].sort((a, b) => b.value - a.value).map((b) => {
              const hl = b.row.memberId === highlightMemberId;
              return (
                <MetricBar
                  key={b.row.memberId}
                  label={b.row.displayName}
                  value={b.value}
                  max={max}
                  min={baseline}
                  className={hl ? "bg-[var(--brand-primary)]" : "bg-zinc-400 dark:bg-zinc-600"}
                  formatValue={(v) => formatMetricChartValue(v, metric.isPercent)}
                  hint={
                    b.lowSample ?
                      `樣本 ${b.sampleSize}（已收縮調整）`
                    : b.sampleSize > 0 ?
                      `樣本 ${b.sampleSize}`
                    : undefined
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type CompareView = "team" | "pick";

/** 全隊個人數據圖表（註解：分類 tabs + 自選比較）。 */
export function MatchPlayerStatsCharts({
  playerStats,
  highlightMemberId,
}: {
  playerStats: PlayerStatsRow[];
  highlightMemberId?: string;
}) {
  const match = useMatchModule();
  const categories = match.categories.filter((c) =>
    playerStats.some((p) => match.hasCategoryData(p.stats, c)),
  );

  if (categories.length === 0) return null;

  const [active, setActive] = useState<string>(categories[0]);
  const [compareView, setCompareView] = useState<CompareView>("team");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">個人數據（比較）</h3>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setCompareView("team")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              compareView === "team" ?
                "bg-[var(--brand-primary)] text-white"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            全隊分類
          </button>
          <button
            type="button"
            onClick={() => setCompareView("pick")}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              compareView === "pick" ?
                "bg-[var(--brand-primary)] text-white"
              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            自選比較
          </button>
        </div>
      </div>

      {compareView === "team" ?
        <>
          <CategoryTabs
            active={active}
            categories={categories}
            labels={match.categoryLabels}
            onChange={setActive}
          />
          <CombinedCategoryComparisonChart
            category={active}
            rows={playerStats}
            highlightMemberId={highlightMemberId}
          />
        </>
      : (
        <PlayerMetricComparisonChart rows={playerStats} highlightMemberId={highlightMemberId} />
      )}
    </div>
  );
}

/** 球員端：我的數據圖表卡片。 */
export function PersonalStatsChartGrid({
  stats,
  teamRows,
}: {
  stats: PlayerStatsRecord;
  teamRows?: PlayerStatsRow[];
}) {
  const match = useMatchModule();
  const categories = match.categories.filter((c) => match.hasCategoryData(stats, c));

  if (categories.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((c) => (
        <div
          key={c}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-zinc-900"
        >
          <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            {match.categoryLabels[c]}
          </h4>
          <div className="mt-3">
            <PersonalCategoryChart stats={stats} category={c} teamRows={teamRows} />
          </div>
        </div>
      ))}
    </div>
  );
}
