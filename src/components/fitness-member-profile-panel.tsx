"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  FITNESS_TEST_ITEMS,
  FITNESS_TEST_ITEM_BY_KEY,
  formatBodyMetric,
  formatFitnessUnit,
  formatFitnessValue,
  fitnessChartBarRatio,
  type FitnessTestItemKey,
} from "@/lib/fitness/test-schema";
import type { DashboardMemberFitnessProfile } from "@/lib/fitness/aggregate";
import { formatDateTimeZh } from "@/lib/format-datetime";

type SessionPoint = DashboardMemberFitnessProfile["sessions"][number];

function fmtDelta(key: FitnessTestItemKey, delta: number | null): string {
  if (delta == null || !Number.isFinite(delta)) return "";
  const def = FITNESS_TEST_ITEM_BY_KEY[key];
  const sign = delta > 0 ? "+" : "";
  return `${sign}${delta.toFixed(def.decimalPlaces)}${formatFitnessUnit(def.unit)}`;
}

function deltaClass(delta: number | null): string {
  if (delta == null || delta === 0) return "text-zinc-500";
  return delta > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400";
}

/** 單項跨場次迷你趨勢（註解：由舊到新排列的小柱）。 */
function FitnessItemSessionTrend({
  itemKey,
  sessions,
}: {
  itemKey: FitnessTestItemKey;
  sessions: SessionPoint[];
}) {
  const def = FITNESS_TEST_ITEM_BY_KEY[itemKey];
  const points = useMemo(() => {
    return [...sessions]
      .reverse()
      .map((s) => ({
        iso: s.startsAtIso,
        value: s.stats[itemKey].best,
      }))
      .filter((p): p is { iso: string; value: number } => p.value != null);
  }, [itemKey, sessions]);

  if (points.length === 0) return null;

  return (
    <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{def.label}</p>
      <div className="mt-2 flex items-end gap-1">
        {points.map((p) => {
          const ratio = fitnessChartBarRatio(itemKey, p.value);
          const h = Math.max(8, Math.round(ratio * 48));
          return (
            <div key={p.iso} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="flex h-12 w-full items-end justify-center">
                <div
                  className="w-full max-w-[2rem] rounded-t bg-[var(--brand-primary)]/80"
                  style={{ height: h }}
                  title={`${formatFitnessValue(p.value, def.decimalPlaces)}${formatFitnessUnit(def.unit)}`}
                />
              </div>
              <span className="text-[9px] tabular-nums text-zinc-400">
                {formatDateTimeZh(new Date(p.iso), { month: "numeric", day: "numeric" })}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-zinc-400">{points.length} 場 · 由左（舊）至右（新）</p>
    </div>
  );
}

type Props = {
  fitness: DashboardMemberFitnessProfile;
};

/** 球員體能摘要：最近一次、Δ、跨場趨勢（註解：用於總覽 popup）。 */
export function FitnessMemberProfilePanel({ fitness }: Props) {
  const latestItems = FITNESS_TEST_ITEMS.filter(
    (item) => fitness.latest?.stats[item.key].best != null,
  );
  const trendItems = FITNESS_TEST_ITEMS.filter((item) =>
    fitness.sessions.some((s) => s.stats[item.key].best != null),
  );

  if (fitness.sessionCount === 0 || !fitness.latest) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        尚無體能測試紀錄。完成體能測試事件後會顯示於此。
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">最近一次</p>
            <p className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {fitness.latest.eventTitle}
            </p>
            <p className="text-xs text-zinc-500">
              {formatDateTimeZh(new Date(fitness.latest.startsAtIso), {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          </div>
          <Link
            href={`/coach/events/${fitness.latest.eventId}`}
            className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
          >
            查看場次
          </Link>
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-zinc-500">身高</dt>
            <dd className="font-semibold tabular-nums">{formatBodyMetric(fitness.latest.heightCm, "cm")}</dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">體重</dt>
            <dd className="font-semibold tabular-nums">{formatBodyMetric(fitness.latest.weightKg, "kg")}</dd>
          </div>
        </dl>
      </div>

      {latestItems.length > 0 ?
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">各項成績</p>
          <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <tbody>
                {latestItems.map((item) => {
                  const best = fitness.latest!.stats[item.key].best!;
                  const delta = fitness.deltas[item.key];
                  return (
                    <tr key={item.key} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800">
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{item.label}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {formatFitnessValue(best, item.decimalPlaces)}
                        {formatFitnessUnit(item.unit)}
                      </td>
                      <td className={`px-3 py-2 text-right text-xs tabular-nums ${deltaClass(delta)}`}>
                        {delta != null ? fmtDelta(item.key, delta) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {fitness.sessionCount >= 2 ?
            <p className="mt-1 text-[10px] text-zinc-400">Δ 為與上一場比較</p>
          : null}
        </div>
      : null}

      {fitness.sessions.length >= 2 && trendItems.length > 0 ?
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">跨場趨勢</p>
          {trendItems.map((item) => (
            <FitnessItemSessionTrend key={item.key} itemKey={item.key} sessions={fitness.sessions} />
          ))}
        </div>
      : fitness.sessionCount === 1 ?
        <p className="text-xs text-zinc-500">完成第二場體能測試後可顯示跨場趨勢。</p>
      : null}
    </div>
  );
}
