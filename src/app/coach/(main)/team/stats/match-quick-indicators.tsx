"use client";

import { useEffect, useMemo, useState } from "react";

import { DataViewModeToggle } from "@/components/data-view-mode-toggle";
import { useDataViewMode } from "@/components/data-view-mode-provider";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useMatchModule } from "@/components/team-sport-provider";
import { computeAdjustedRating, ratingChartBarWidth } from "@/lib/sports/match/metrics";
import type { PlayerStatsRecord } from "@/lib/sports/match/types";

export type QuickIndicatorRow = {
  memberId: string;
  displayName: string;
  jerseyNumber: number | null;
  squad: string | null;
  position: string | null;
  matchCount: number;
  stats: PlayerStatsRecord;
  /** 各 rating 鍵 → 數值 */
  ratings: Record<string, number | null>;
  overall: number | null;
};

type SortKey = "displayName" | "matchCount" | "overall" | string;

type SortDir = "asc" | "desc";

function compareNullable(a: number | null, b: number | null, dir: SortDir) {
  const av = a ?? (dir === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
  const bv = b ?? (dir === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
  return dir === "asc" ? av - bv : bv - av;
}

function nextDir(current: SortDir): SortDir {
  return current === "asc" ? "desc" : "asc";
}

function ThButton({
  label,
  active,
  dir,
  onClick,
  align = "center",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "center" | "right";
}) {
  const alignClass = align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center justify-center gap-1 hover:underline ${alignClass}`}
    >
      <span>{label}</span>
      {active ?
        <span aria-hidden className="text-[10px] text-zinc-400">
          {dir === "asc" ? "▲" : "▼"}
        </span>
      : null}
    </button>
  );
}

function fmt(value: number | null, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function barWidth(value: number | null, min: number, max: number): string {
  if (value == null || !Number.isFinite(value) || max <= min) return "0%";
  const x = (value - min) / (max - min);
  return `${Math.round(Math.min(1, Math.max(0, x)) * 100)}%`;
}

function perMatch(value: number, matchCount: number): number {
  if (!Number.isFinite(matchCount) || matchCount <= 0) return 0;
  return Math.round((value / matchCount) * 100) / 100;
}

function MetricRow({ label, total, avg }: { label: string; total: number; avg: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-xs text-zinc-500">總</span>
        <span className="w-16 text-right text-sm font-semibold tabular-nums">{total}</span>
        <span className="text-xs text-zinc-500">均</span>
        <span className="w-16 text-right text-sm font-semibold tabular-nums">{avg}</span>
      </div>
    </div>
  );
}

const BAR_COLORS = [
  "bg-emerald-500",
  "bg-sky-500",
  "bg-fuchsia-500",
  "bg-amber-500",
  "bg-orange-500",
  "bg-violet-500",
];

/** 總指標比較：popup 內以卡片並排顯示（註解：隊伍統計累計數據）。 */
function OverallIndicatorCompareSheet({
  open,
  onClose,
  rows,
}: {
  open: boolean;
  onClose: () => void;
  rows: QuickIndicatorRow[];
}) {
  const match = useMatchModule();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [samePositionOnly, setSamePositionOnly] = useState(false);

  const anchorId = selectedIds[0] ?? "";
  const anchor = rows.find((p) => p.memberId === anchorId);

  useEffect(() => {
    if (!open) return;
    if (selectedIds.length > 0) return;
    if (rows.length > 0) {
      setSelectedIds(rows.slice(0, Math.min(3, rows.length)).map((p) => p.memberId));
    }
  }, [open, rows, selectedIds.length]);

  const visiblePlayers = useMemo(() => {
    if (!samePositionOnly || !anchor?.position?.trim()) return rows;
    const pos = anchor.position.trim();
    return rows.filter((p) => (p.position?.trim() || "") === pos);
  }, [rows, samePositionOnly, anchor?.position]);

  const compared = useMemo(
    () =>
      selectedIds
        .map((id) => rows.find((p) => p.memberId === id))
        .filter((p): p is QuickIndicatorRow => p != null)
        .sort((a, b) => (b.overall ?? -1) - (a.overall ?? -1)),
    [selectedIds, rows],
  );

  function togglePlayer(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title="總指標比較"
      subtitle="選擇球員，以卡片並排比較累計表現"
      tall
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
        >
          關閉
        </button>
      }
    >
      <div className="space-y-4">
        {anchor?.position ?
          <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={samePositionOnly}
              onChange={(e) => setSamePositionOnly(e.target.checked)}
              className="rounded border-zinc-300"
            />
            僅顯示同位置（{anchor.position}）
          </label>
        : null}

        <div className="flex flex-wrap gap-1.5">
          {visiblePlayers.map((p) => {
            const on = selectedIds.includes(p.memberId);
            return (
              <button
                key={p.memberId}
                type="button"
                onClick={() => togglePlayer(p.memberId)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  on ?
                    "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                {p.displayName}
                {p.jerseyNumber != null ?
                  <span className="ml-1 opacity-70">#{p.jerseyNumber}</span>
                : null}
                {p.position ? <span className="ml-1 opacity-70">· {p.position}</span> : null}
              </button>
            );
          })}
        </div>

        {compared.length === 0 ?
          <p className="text-sm text-zinc-500">請選擇至少一位球員。</p>
        : (
          <div className="grid gap-3 sm:grid-cols-2">
            {compared.map((row) => {
              const ratings = match.ratings
                .map((def, i) => {
                  const { adjusted, lowSample, sampleSize } = computeAdjustedRating(def, row.stats);
                  return {
                    def,
                    adjusted,
                    lowSample,
                    sampleSize,
                    barClass: BAR_COLORS[i % BAR_COLORS.length],
                  };
                })
                .filter((x) => x.adjusted != null);

              return (
                <div
                  key={row.memberId}
                  className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                        {row.displayName}
                        {row.jerseyNumber != null ?
                          <span className="ml-1 text-xs font-normal text-zinc-500">#{row.jerseyNumber}</span>
                        : null}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {row.position ?? (row.squad ? `分組 ${row.squad}` : "未分組")} · {row.matchCount} 場
                      </p>
                    </div>
                    <p className="shrink-0 text-2xl font-bold tabular-nums text-indigo-700 dark:text-indigo-300">
                      {row.overall != null ? row.overall.toFixed(1) : "—"}
                    </p>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-indigo-500"
                      style={{ width: barWidth(row.overall, 0, 100) }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-zinc-400">總指標（0–100）</p>

                  {ratings.length > 0 ?
                    <div className="mt-3 space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                      {ratings.map((x) => (
                        <div key={x.def.key}>
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>
                              {x.def.label}
                              {x.lowSample ?
                                <span className="ml-1 text-amber-600" title={`樣本 ${x.sampleSize}`}>
                                  *
                                </span>
                              : null}
                            </span>
                            <span className="tabular-nums">{fmt(x.adjusted)}</span>
                          </div>
                          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className={`h-full rounded-full ${x.barClass}`}
                              style={{ width: ratingChartBarWidth(x.adjusted, x.def) }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

/** 比賽快速指標：依運動模組動態 rating 欄位 */
export function MatchQuickIndicators({
  rows,
  defaultSortKey = "overall",
}: {
  rows: QuickIndicatorRow[];
  defaultSortKey?: SortKey;
}) {
  const match = useMatchModule();
  const { mode } = useDataViewMode();
  const [sortKey, setSortKey] = useState<SortKey>(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<QuickIndicatorRow | null>(null);
  const [overallOpen, setOverallOpen] = useState(false);

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      if (sortKey === "displayName") {
        const cmp = a.displayName.localeCompare(b.displayName, "zh-Hant");
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortKey === "matchCount") return compareNullable(a.matchCount, b.matchCount, sortDir);
      if (sortKey === "overall") return compareNullable(a.overall, b.overall, sortDir);
      {
        const defA = match.ratings.find((d) => d.key === sortKey);
        const defB = match.ratings.find((d) => d.key === sortKey);
        if (defA && defB) {
          const av = computeAdjustedRating(defA, a.stats).adjusted;
          const bv = computeAdjustedRating(defB, b.stats).adjusted;
          return compareNullable(av, bv, sortDir);
        }
        return compareNullable(a.ratings[sortKey] ?? null, b.ratings[sortKey] ?? null, sortDir);
      }
    });
    return out;
  }, [rows, sortKey, sortDir, match]);

  function setSort(k: SortKey) {
    if (k === sortKey) {
      setSortDir((d) => nextDir(d));
      return;
    }
    setSortKey(k);
    setSortDir(k === "displayName" ? "asc" : "desc");
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">快速指標</p>
          <HintExclamationToggle>
            各 rating 依運動模組計算；樣本偏少時會向區間中點收縮，避免觸球少卻極端高分。總指標＝收縮後 rating 正規化平均（0–100）。
          </HintExclamationToggle>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setOverallOpen(true)}
            disabled={rows.length === 0}
            className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
          >
            總指標比較
          </button>
          <DataViewModeToggle />
        </div>
      </div>

      {mode === "chart" ?
        <div className="space-y-2">
          {sorted.map((r) => {
            const indicators = match.ratings
              .map((def, i) => {
                const { adjusted, lowSample, sampleSize } = computeAdjustedRating(def, r.stats);
                return {
                  key: def.key,
                  label: def.label,
                  value: adjusted,
                  def,
                  barClass: BAR_COLORS[i % BAR_COLORS.length],
                  lowSample,
                  sampleSize,
                };
              })
              .filter((x) => x.value != null);

            return (
              <button
                key={r.memberId}
                type="button"
                onClick={() => setSelected(r)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-950"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {r.displayName}
                    {r.jerseyNumber != null ?
                      <span className="ml-1 text-xs text-zinc-500">#{r.jerseyNumber}</span>
                    : null}
                    <span className="ml-2 text-xs text-zinc-500">({r.matchCount} 場)</span>
                  </p>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-indigo-700 dark:text-indigo-300">
                    {r.overall != null ? r.overall.toFixed(1) : "—"}
                  </p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: barWidth(r.overall, 0, 100) }}
                  />
                </div>
                {indicators.length > 0 ?
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {indicators.map((x) => (
                      <div key={x.key}>
                        <div className="flex items-center justify-between text-xs text-zinc-500">
                          <span>
                            {x.label}
                            {x.lowSample ?
                              <span className="ml-1 text-amber-600" title={`樣本 ${x.sampleSize}，已收縮調整`}>
                                *
                              </span>
                            : null}
                          </span>
                          <span className="tabular-nums">{fmt(x.value)}</span>
                        </div>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className={`h-full rounded-full ${x.barClass}`}
                            style={{ width: ratingChartBarWidth(x.value, x.def) }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                : null}
              </button>
            );
          })}
          {sorted.length === 0 ?
            <p className="text-sm text-zinc-500">尚無比賽個人數據。</p>
          : null}
        </div>
      : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <tr>
                <th className="py-2 pr-3 font-medium">
                  <ThButton label="球員" active={sortKey === "displayName"} dir={sortDir} onClick={() => setSort("displayName")} align="left" />
                </th>
                <th className="py-2 pr-3 font-medium">
                  <ThButton label="場次" active={sortKey === "matchCount"} dir={sortDir} onClick={() => setSort("matchCount")} />
                </th>
                {match.ratings.map((def) => (
                  <th key={def.key} className="py-2 pr-3 font-medium">
                    <ThButton
                      label={`${def.label}rating`}
                      active={sortKey === def.key}
                      dir={sortDir}
                      onClick={() => setSort(def.key)}
                    />
                  </th>
                ))}
                <th className="py-2 pr-3 font-medium">
                  <ThButton label="總指標" active={sortKey === "overall"} dir={sortDir} onClick={() => setSort("overall")} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sorted.map((r) => (
                <tr key={r.memberId} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/60">
                  <td className="py-2.5 pr-3">
                    <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                      {r.displayName}
                      {r.jerseyNumber != null ?
                        <span className="ml-1 text-xs text-zinc-500">#{r.jerseyNumber}</span>
                      : null}
                    </p>
                    <p className="text-xs text-zinc-500">{r.squad ? `分組 ${r.squad}` : "未分組"}</p>
                  </td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{r.matchCount}</td>
                  {match.ratings.map((def) => {
                    const { adjusted, lowSample } = computeAdjustedRating(def, r.stats);
                    return (
                      <td key={def.key} className="py-2.5 pr-3 text-center tabular-nums">
                        {fmt(adjusted)}
                        {lowSample ?
                          <span className="text-amber-600" title="樣本偏少，已收縮調整">
                            *
                          </span>
                        : null}
                      </td>
                    );
                  })}
                  <td className="py-2.5 pr-3 text-center tabular-nums">
                    {r.overall != null ? r.overall.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 ?
            <p className="mt-2 text-sm text-zinc-500">尚無比賽個人數據。</p>
          : null}
        </div>
      )}

      <BottomSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        title="比賽個人數據"
        subtitle={selected ? `${selected.displayName} · ${selected.matchCount} 場` : undefined}
        footer={
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
          >
            關閉
          </button>
        }
      >
        {selected ?
          <div className="space-y-5">
            <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">快速指標</p>
              <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-zinc-500">總指標</dt>
                  <dd className="font-semibold tabular-nums">
                    {selected.overall != null ? selected.overall.toFixed(1) : "—"}
                  </dd>
                </div>
                {match.ratings.map((def) => {
                  const { adjusted, lowSample, sampleSize } = computeAdjustedRating(def, selected.stats);
                  return (
                    <div key={def.key}>
                      <dt className="text-xs text-zinc-500">
                        {def.label} rating
                        {lowSample ? <span className="text-amber-600">（樣本 {sampleSize}）</span> : null}
                      </dt>
                      <dd className="font-semibold tabular-nums">{fmt(adjusted)}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
            <div className="space-y-4">
              {match.categories.map((c) => {
                if (!match.hasCategoryData(selected.stats, c)) return null;
                const cat = selected.stats[c] as Record<string, number>;
                const defs = (match.categoryFields[c] ?? []).filter((d) => !d.derived);
                return (
                  <div key={c} className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      {match.categoryLabels[c]}
                    </p>
                    {defs.map((d) => (
                      <MetricRow
                        key={d.key}
                        label={d.label}
                        total={cat[d.key] ?? 0}
                        avg={perMatch(cat[d.key] ?? 0, selected.matchCount)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        : null}
      </BottomSheet>

      <OverallIndicatorCompareSheet open={overallOpen} onClose={() => setOverallOpen(false)} rows={rows} />
    </div>
  );
}
