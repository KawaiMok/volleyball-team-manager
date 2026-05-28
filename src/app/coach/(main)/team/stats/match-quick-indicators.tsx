"use client";

import { useMemo, useState } from "react";

import { DataViewModeToggle } from "@/components/data-view-mode-toggle";
import { useDataViewMode } from "@/components/data-view-mode-provider";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { CATEGORY_FIELDS } from "@/lib/match-player-stats-fields";
import { hasCategoryData, STAT_CATEGORIES, STAT_CATEGORY_LABELS, type PlayerMatchStats, type StatCategory } from "@/lib/match-result-schema";

type SortKey =
  | "displayName"
  | "matchCount"
  | "attackRating"
  | "defenseRating"
  | "blockRating"
  | "passRating"
  | "serveRating"
  | "overall";

type SortDir = "asc" | "desc";

export type QuickIndicatorRow = {
  memberId: string;
  displayName: string;
  jerseyNumber: number | null;
  squad: string | null;
  matchCount: number;
  /** 累計原始計數（註解：供 popup 顯示總數/場均）。 */
  stats: PlayerMatchStats;
  attackRating: number | null;
  defenseRating: number | null;
  blockRating: number | null;
  passRating: number | null;
  serveRating: number | null;
  overall: number | null; // 0–100
};

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
      aria-label={active ? `排序：${label}（目前 ${dir === "asc" ? "升冪" : "降冪"}，點擊切換）` : `排序：${label}`}
    >
      <span>{label}</span>
      {active ? <span aria-hidden className="text-[10px] text-zinc-400">{dir === "asc" ? "▲" : "▼"}</span> : null}
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
  const clamped = Math.min(1, Math.max(0, x));
  return `${Math.round(clamped * 100)}%`;
}

function perMatch(value: number, matchCount: number): number {
  if (!Number.isFinite(matchCount) || matchCount <= 0) return 0;
  return Math.round((value / matchCount) * 100) / 100;
}

function MetricRow({
  label,
  total,
  avg,
}: {
  label: string;
  total: number;
  avg: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">總</span>
        <span className="w-16 text-right text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{total}</span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">均</span>
        <span className="w-16 text-right text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{avg}</span>
      </div>
    </div>
  );
}

function CategoryPopupSection({
  category,
  stats,
  matchCount,
}: {
  category: StatCategory;
  stats: PlayerMatchStats;
  matchCount: number;
}) {
  if (!hasCategoryData(stats, category)) return null;
  const cat = stats[category] as Record<string, number> | undefined;
  if (!cat) return null;
  const defs = (CATEGORY_FIELDS[category] ?? []).filter((d) => !d.derived);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {STAT_CATEGORY_LABELS[category]}
      </p>
      <div className="space-y-2">
        {defs.map((d) => {
          const v = cat[d.key] ?? 0;
          return <MetricRow key={d.key} label={d.label} total={v} avg={perMatch(v, matchCount)} />;
        })}
      </div>
    </div>
  );
}

/** 比賽快速指標：可排序表格 + 可視化切換（註解：用同一份彙總資料）。 */
export function MatchQuickIndicators({
  rows,
  defaultSortKey = "overall",
}: {
  rows: QuickIndicatorRow[];
  defaultSortKey?: SortKey;
}) {
  const { mode } = useDataViewMode();
  const [sortKey, setSortKey] = useState<SortKey>(defaultSortKey);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<QuickIndicatorRow | null>(null);

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      if (sortKey === "displayName") {
        const cmp = a.displayName.localeCompare(b.displayName, "zh-Hant");
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortKey === "matchCount") return compareNullable(a.matchCount, b.matchCount, sortDir);
      if (sortKey === "attackRating") return compareNullable(a.attackRating, b.attackRating, sortDir);
      if (sortKey === "defenseRating") return compareNullable(a.defenseRating, b.defenseRating, sortDir);
      if (sortKey === "blockRating") return compareNullable(a.blockRating, b.blockRating, sortDir);
      if (sortKey === "passRating") return compareNullable(a.passRating, b.passRating, sortDir);
      if (sortKey === "serveRating") return compareNullable(a.serveRating, b.serveRating, sortDir);
      if (sortKey === "overall") return compareNullable(a.overall, b.overall, sortDir);
      return 0;
    });
    return out;
  }, [rows, sortKey, sortDir]);

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
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">快速指標</p>
          <HintExclamationToggle>
            攻擊rating＝(得分-失誤)/次數；防守rating＝(成功-失誤)/次數；總指標＝各範疇 rating 正規化後平均（0–100）。
          </HintExclamationToggle>
        </div>
        <DataViewModeToggle />
      </div>

      {mode === "chart" ? (
        <div className="space-y-2">
          {sorted.map((r) => (
            <button
              key={r.memberId}
              type="button"
              onClick={() => setSelected(r)}
              className="w-full text-left rounded-lg border border-zinc-200 bg-white px-3 py-2.5 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-950"
              aria-label={`查看 ${r.displayName} 的總數/場均`}
            >
              {/** 註解：只顯示該球員有值的 rating，避免空欄。 */}
              {(() => {
                const indicators: Array<{
                  key: string;
                  label: string;
                  value: number | null;
                  min: number;
                  max: number;
                  barClass: string;
                }> = [
                  { key: "attack", label: "攻擊 rating", value: r.attackRating, min: -1, max: 1, barClass: "bg-emerald-500" },
                  { key: "defense", label: "防守 rating", value: r.defenseRating, min: -1, max: 1, barClass: "bg-sky-500" },
                  { key: "block", label: "攔網 rating", value: r.blockRating, min: 0, max: 3, barClass: "bg-fuchsia-500" },
                  { key: "pass", label: "一傳 rating", value: r.passRating, min: -1, max: 3, barClass: "bg-amber-500" },
                  { key: "serve", label: "發球 rating", value: r.serveRating, min: -1, max: 4, barClass: "bg-orange-500" },
                ].filter((x) => x.value != null);

                return (
                  <>
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  {r.displayName}
                  {r.jerseyNumber != null ? <span className="ml-1 text-xs text-zinc-500">#{r.jerseyNumber}</span> : null}
                  <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">({r.matchCount} 場)</span>
                </p>
                <p className="shrink-0 text-sm font-semibold tabular-nums text-indigo-700 dark:text-indigo-300">
                  {r.overall != null ? `${r.overall.toFixed(1)}` : "—"}
                </p>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: barWidth(r.overall, 0, 100) }}
                  aria-label="總指標"
                />
              </div>
              {indicators.length > 0 ?
                <div className="mt-2 grid gap-2 md:grid-cols-2">
                  {indicators.map((x) => (
                    <div key={x.key}>
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span>{x.label}</span>
                        <span className="tabular-nums">{fmt(x.value)}</span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                        <div className={`h-full rounded-full ${x.barClass}`} style={{ width: barWidth(x.value, x.min, x.max) }} />
                      </div>
                    </div>
                  ))}
                </div>
              : null}
                  </>
                );
              })()}
            </button>
          ))}
          {sorted.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">尚無比賽個人數據。</p>
          ) : null}

          <BottomSheet
            open={selected !== null}
            onClose={() => setSelected(null)}
            title="比賽個人數據"
            subtitle={selected ? `${selected.displayName} · ${selected.matchCount} 場（有填數據）` : undefined}
            titleId="coach-match-indicator-sheet"
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
            {selected ? (
              <div className="space-y-5">
                <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">快速指標</p>
                  <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">總指標</dt>
                      <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                        {selected.overall != null ? selected.overall.toFixed(1) : "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">攻擊 rating</dt>
                      <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{fmt(selected.attackRating)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">防守 rating</dt>
                      <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{fmt(selected.defenseRating)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">攔網 rating</dt>
                      <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{fmt(selected.blockRating)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">一傳 rating</dt>
                      <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{fmt(selected.passRating)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-zinc-500 dark:text-zinc-400">發球 rating</dt>
                      <dd className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{fmt(selected.serveRating)}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-4">
                  {STAT_CATEGORIES.map((c) => (
                    <CategoryPopupSection
                      key={c}
                      category={c}
                      stats={selected.stats}
                      matchCount={selected.matchCount}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </BottomSheet>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[62rem] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="py-2 pr-3 font-medium text-left">
                  <ThButton label="球員" active={sortKey === "displayName"} dir={sortDir} onClick={() => setSort("displayName")} align="left" />
                </th>
                <th className="py-2 pr-3 font-medium">
                  <ThButton label="場次" active={sortKey === "matchCount"} dir={sortDir} onClick={() => setSort("matchCount")} />
                </th>
                <th className="py-2 pr-3 font-medium">
                  <ThButton label="攻擊rating" active={sortKey === "attackRating"} dir={sortDir} onClick={() => setSort("attackRating")} />
                </th>
                <th className="py-2 pr-3 font-medium">
                  <ThButton label="防守rating" active={sortKey === "defenseRating"} dir={sortDir} onClick={() => setSort("defenseRating")} />
                </th>
                <th className="py-2 pr-3 font-medium">
                  <ThButton label="攔網rating" active={sortKey === "blockRating"} dir={sortDir} onClick={() => setSort("blockRating")} />
                </th>
                <th className="py-2 pr-3 font-medium">
                  <ThButton label="一傳rating" active={sortKey === "passRating"} dir={sortDir} onClick={() => setSort("passRating")} />
                </th>
                <th className="py-2 pr-3 font-medium">
                  <ThButton label="發球rating" active={sortKey === "serveRating"} dir={sortDir} onClick={() => setSort("serveRating")} />
                </th>
                <th className="py-2 pr-3 font-medium">
                  <ThButton label="總指標" active={sortKey === "overall"} dir={sortDir} onClick={() => setSort("overall")} />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sorted.map((r) => (
                <tr key={r.memberId} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/60">
                  <td className="py-2.5 pr-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {r.displayName}
                        {r.jerseyNumber != null ? <span className="ml-1 text-xs text-zinc-500">#{r.jerseyNumber}</span> : null}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{r.squad ? `分組 ${r.squad}` : "未分組"}</p>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{r.matchCount}</td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{fmt(r.attackRating)}</td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{fmt(r.defenseRating)}</td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{fmt(r.blockRating)}</td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{fmt(r.passRating)}</td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{fmt(r.serveRating)}</td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">
                    {r.overall != null ? r.overall.toFixed(1) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">尚無比賽個人數據。</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

