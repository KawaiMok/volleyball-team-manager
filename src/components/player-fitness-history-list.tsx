"use client";

import Link from "next/link";

import {
  FITNESS_TEST_ITEMS,
  formatFitnessUnit,
  formatFitnessValue,
  type FitnessTestStats,
} from "@/lib/fitness/test-schema";
import { formatDateTimeZh } from "@/lib/format-datetime";

export type PlayerFitnessHistoryItem = {
  eventId: string;
  eventTitle: string;
  eventStartsAt: string;
  stats: FitnessTestStats;
};

type Props = {
  items: PlayerFitnessHistoryItem[];
};

/** 球員體能測試歷史列表（註解：每場顯示 6 項 best）。 */
export function PlayerFitnessHistoryList({ items }: Props) {
  if (items.length === 0) {
    return (
      <li className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
        尚無體能測試紀錄。教練登錄後會顯示在此。
      </li>
    );
  }

  return (
    <>
      {items.map((item) => (
        <li key={item.eventId}>
          <Link
            href={`/player/events/${item.eventId}`}
            className="block px-4 py-4 hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-900 dark:text-slate-50">{item.eventTitle}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {formatDateTimeZh(new Date(item.eventStartsAt), {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span className="shrink-0 text-xs font-medium text-[var(--brand-primary)]">詳情 →</span>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3">
              {FITNESS_TEST_ITEMS.map((def) => {
                const best = item.stats[def.key].best;
                if (best == null) return null;
                return (
                  <div key={def.key}>
                    <dt className="text-slate-500 dark:text-slate-400">{def.label}</dt>
                    <dd className="font-medium tabular-nums text-slate-800 dark:text-slate-200">
                      {formatFitnessValue(best, def.decimalPlaces)}
                      {formatFitnessUnit(def.unit)}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </Link>
        </li>
      ))}
    </>
  );
}
