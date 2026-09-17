"use client";

import {
  FITNESS_TEST_ITEM_BY_KEY,
  fitnessChartBarRatio,
  fitnessChartScaleLabel,
  formatFitnessUnit,
  formatFitnessValue,
  type FitnessTestItemKey,
} from "@/lib/fitness/test-schema";

export type FitnessCompareBarRow = {
  id: string;
  label: string;
  value: number;
};

type Props = {
  itemKey: FitnessTestItemKey;
  rows: FitnessCompareBarRow[];
  /** 是否顯示刻度 0–N（註解：預設 true）。 */
  showScale?: boolean;
};

/** 體能項目橫向比較柱（註解：固定刻度，最差者仍有可見柱寬）。 */
export function FitnessCompareBars({ itemKey, rows, showScale = true }: Props) {
  const def = FITNESS_TEST_ITEM_BY_KEY[itemKey];
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">尚無數據</p>;
  }

  return (
    <div className="space-y-2">
      {rows.map((b) => {
        const ratio = fitnessChartBarRatio(itemKey, b.value);
        const width = `${Math.round(Math.min(1, Math.max(0, ratio)) * 100)}%`;
        return (
          <div key={b.id} className="flex items-center gap-2 text-xs">
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
              {formatFitnessValue(b.value, def.decimalPlaces)}
              {formatFitnessUnit(def.unit)}
            </span>
          </div>
        );
      })}
      {showScale ?
        <p className="pt-1 text-[10px] text-zinc-400">
          刻度 {fitnessChartScaleLabel(itemKey)}
          {def.unit === "cm" ? " cm" : def.unit === "sec" ? " 秒" : " m"}
        </p>
      : null}
    </div>
  );
}
