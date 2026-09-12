"use client";

import {
  DEFAULT_EQUIPMENT_NOTE,
  DEFAULT_SHUTTLE_PROTOCOL,
  FITNESS_TEST_ITEMS,
  FITNESS_TEST_ITEM_BY_KEY,
  formatFitnessUnit,
  formatFitnessValue,
  type FitnessTestStats,
} from "@/lib/fitness/test-schema";

type Props = {
  stats: FitnessTestStats;
  protocolNote: string | null;
  equipmentNote: string | null;
  notes: string | null;
};

/** 球員：唯讀個人體能測試成績（註解：6 項 attempts + best）。 */
export function FitnessTestReadonly({ stats, protocolNote, equipmentNote, notes }: Props) {
  const hasData = FITNESS_TEST_ITEMS.some((item) => stats[item.key].best != null);

  if (!hasData) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">教練尚未登錄你的體能測試數據。</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-zinc-950">
        <p className="text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-800 dark:text-slate-200">折返跑協議：</span>
          {protocolNote?.trim() || DEFAULT_SHUTTLE_PROTOCOL}
        </p>
        {(equipmentNote?.trim() || DEFAULT_EQUIPMENT_NOTE) ?
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-800 dark:text-slate-200">器材：</span>
            {equipmentNote?.trim() || DEFAULT_EQUIPMENT_NOTE}
          </p>
        : null}
        {notes ?
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-800 dark:text-slate-200">備註：</span>
            {notes}
          </p>
        : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {FITNESS_TEST_ITEMS.map((item) => {
          const row = stats[item.key];
          if (row.best == null) return null;
          return (
            <div
              key={item.key}
              className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-zinc-900"
            >
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{item.label}</h4>
              <dl className="mt-2 space-y-1 text-sm">
                {row.attempts.map((attempt, i) =>
                  attempt != null ?
                    <div key={i} className="flex justify-between gap-2">
                      <dt className="text-slate-500">
                        {item.attemptCount === 1 ? "成績" : `第 ${i + 1} 次`}
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {formatFitnessValue(attempt, item.decimalPlaces)}
                        {formatFitnessUnit(item.unit)}
                      </dd>
                    </div>
                  : null,
                )}
                <div className="flex justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
                  <dt className="font-medium text-slate-700 dark:text-slate-300">
                    {FITNESS_TEST_ITEM_BY_KEY[item.key].higherIsBetter ? "最佳" : "成績"}
                  </dt>
                  <dd className="font-semibold tabular-nums text-[var(--brand-primary)]">
                    {formatFitnessValue(row.best, item.decimalPlaces)}
                    {formatFitnessUnit(item.unit)}
                  </dd>
                </div>
              </dl>
            </div>
          );
        })}
      </div>
    </div>
  );
}
