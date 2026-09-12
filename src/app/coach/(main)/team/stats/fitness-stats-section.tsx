"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import {
  FITNESS_TEST_ITEMS,
  FITNESS_TEST_ITEM_BY_KEY,
  formatFitnessUnit,
  formatFitnessValue,
  type FitnessTestItemKey,
} from "@/lib/fitness/test-schema";
import type { MemberFitnessTrendRow } from "@/lib/fitness/aggregate";
import { buildFitnessTrendCsv, downloadCsvFile } from "@/lib/fitness/export-csv";
import { formatDateTimeZh } from "@/lib/format-datetime";

type Props = {
  rows: MemberFitnessTrendRow[];
  sessionCount: number;
};

function fmtDelta(key: FitnessTestItemKey, delta: number | null): string {
  if (delta == null || !Number.isFinite(delta)) return "";
  const def = FITNESS_TEST_ITEM_BY_KEY[key];
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(def.decimalPlaces)}${formatFitnessUnit(def.unit)}`;
}

function deltaClass(delta: number | null): string {
  if (delta == null || delta === 0) return "text-zinc-500 dark:text-zinc-400";
  return delta > 0 ?
      "text-emerald-700 dark:text-emerald-400"
    : "text-rose-700 dark:text-rose-400";
}

/** 教練：隊伍體能測試趨勢（註解：最新成績 + 與上一場 Δ）。 */
export function FitnessStatsSection({ rows, sessionCount }: Props) {
  const [chartKey, setChartKey] = useState<FitnessTestItemKey>("cmj");

  const activeRows = useMemo(
    () => rows.filter((r) => r.latest != null),
    [rows],
  );

  const chartDef = FITNESS_TEST_ITEM_BY_KEY[chartKey];
  const chartBars = useMemo(() => {
    const values = activeRows
      .map((r) => r.latest?.stats[chartKey].best ?? null)
      .filter((v): v is number => v != null);
    if (values.length === 0) return [];
    const max = Math.max(...values);
    const min = Math.min(...values);
    return activeRows
      .map((r) => {
        const value = r.latest?.stats[chartKey].best;
        if (value == null) return null;
        return {
          memberId: r.memberId,
          label: r.displayName,
          value,
          max: chartDef.higherIsBetter ? max : max,
          min: chartDef.higherIsBetter ? min : min,
          invert: !chartDef.higherIsBetter,
        };
      })
      .filter((b): b is NonNullable<typeof b> => b != null);
  }, [activeRows, chartDef.higherIsBetter, chartKey]);

  if (sessionCount === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        尚無已結束的體能測試場次。建立「體能測試」事件並登錄數據後，趨勢會顯示在此。
      </p>
    );
  }

  if (activeRows.length === 0) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        已有 {sessionCount} 場體能測試，但尚無隊員數據。請到各場次事件頁登錄體能測試。
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          樣本：近 {sessionCount} 場已結束體能測試（最多 50 場）。Δ 為與<strong className="font-medium">上一場</strong>
          比較；跳高／藥球正值為進步，折返跑正值代表變快。
        </p>
        <button
          type="button"
          onClick={() => {
            const csv = buildFitnessTrendCsv(rows);
            downloadCsvFile("隊伍體能趨勢.csv", csv);
          }}
          className="shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          匯出 CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <th className="px-2 py-2 font-medium">隊員</th>
              <th className="px-2 py-2 font-medium text-center">場次</th>
              {FITNESS_TEST_ITEMS.map((item) => (
                <th key={item.key} className="px-2 py-2 font-medium text-center">
                  {item.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.memberId} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-2 py-2 font-medium text-zinc-900 dark:text-zinc-50">
                  {r.displayName}
                  {r.jerseyNumber != null ?
                    <span className="ml-1 text-xs font-normal text-zinc-500">#{r.jerseyNumber}</span>
                  : null}
                </td>
                <td className="px-2 py-2 text-center tabular-nums">{r.sessionCount || "—"}</td>
                {FITNESS_TEST_ITEMS.map((item) => {
                  const best = r.latest?.stats[item.key].best ?? null;
                  const delta = r.deltas[item.key];
                  return (
                    <td key={item.key} className="px-2 py-2 text-center tabular-nums">
                      {best != null ?
                        <div className="inline-flex flex-col items-center gap-0.5">
                          <span>
                            {formatFitnessValue(best, item.decimalPlaces)}
                            {formatFitnessUnit(item.unit)}
                          </span>
                          {delta != null ?
                            <span className={`text-[10px] ${deltaClass(delta)}`}>{fmtDelta(item.key, delta)}</span>
                          : null}
                          {r.latest ?
                            <Link
                              href={`/coach/events/${r.latest.eventId}`}
                              className="text-[10px] text-[var(--brand-primary)] hover:underline"
                            >
                              {formatDateTimeZh(new Date(r.latest.startsAtIso), {
                                month: "numeric",
                                day: "numeric",
                              })}
                            </Link>
                          : null}
                        </div>
                      : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">最新一場橫向比較</h3>
          <HintExclamationToggle>各隊員「最近一場」該項目 best 值；僅含已有數據者。</HintExclamationToggle>
        </div>
        <div className="mb-3 flex flex-wrap gap-1">
          {FITNESS_TEST_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setChartKey(item.key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                chartKey === item.key ?
                  "bg-[var(--brand-primary)] text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {chartBars.map((b) => {
            const range = b.max - b.min;
            const ratio =
              range > 0 ?
                b.invert ?
                  (b.max - b.value) / range
                : (b.value - b.min) / range
              : 1;
            const width = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
            return (
              <div key={b.memberId} className="flex items-center gap-2 text-xs">
                <span className="w-20 shrink-0 truncate text-zinc-500 dark:text-zinc-400" title={b.label}>
                  {b.label}
                </span>
                <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-[var(--brand-primary)] transition-all"
                    style={{ width }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatFitnessValue(b.value, chartDef.decimalPlaces)}
                  {formatFitnessUnit(chartDef.unit)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
