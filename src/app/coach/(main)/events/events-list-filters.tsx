"use client";

import Link from "next/link";

import type { CoachEventsListFilterValues, CoachEventTypeKey } from "@/app/coach/(main)/events/coach-events-list-types";
import type { EventStatusKey } from "@/components/domain-status-indicators";

type Props = {
  values: CoachEventsListFilterValues;
  squads: string[];
  hasActiveFilters: boolean;
  /** 月曆錨點 YYYY-MM-DD（註解：套用篩選時保留右側月曆月份）。 */
  calYmd?: string;
};

const ETYPE_OPTIONS: { value: CoachEventTypeKey; label: string }[] = [
  { value: "TRAINING", label: "訓練" },
  { value: "MATCH", label: "比賽" },
  { value: "FITNESS_TEST", label: "體能測試" },
  { value: "OTHER", label: "其他" },
];

const ESTATUS_OPTIONS: { value: EventStatusKey; label: string }[] = [
  { value: "DRAFT", label: "草稿" },
  { value: "PUBLISHED", label: "已發布" },
  { value: "CANCELLED", label: "已取消" },
];

/** 事件列表篩選表單（註解：GET 查詢字串，可分享連結）。 */
export function CoachEventsListFilters({ values, squads, hasActiveFilters, calYmd }: Props) {
  return (
    <form
      method="get"
      action="/coach/events"
      className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/80"
    >
      {calYmd ? <input type="hidden" name="cal" value={calYmd} /> : null}
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[12rem] flex-1 space-y-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">搜尋（標題／地點）</span>
          <input
            name="q"
            type="search"
            placeholder="關鍵字…"
            defaultValue={values.q}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900"
            autoComplete="off"
          />
        </label>
        <label className="min-w-0 w-full flex-1 space-y-1 sm:min-w-[12rem] sm:w-auto">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">開始日起</span>
          <input
            name="from"
            type="date"
            defaultValue={values.fromYmd}
            className="box-border w-full min-w-0 max-w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>
        <label className="min-w-0 w-full space-y-1 sm:w-auto">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">開始日迄</span>
          <input
            name="to"
            type="date"
            defaultValue={values.toYmd}
            className="box-border w-full min-w-0 max-w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          套用
        </button>
        {hasActiveFilters ?
          <Link
            href="/coach/events"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-950"
          >
            重設
          </Link>
        : null}
      </div>

      <details className="group rounded-md border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <summary className="cursor-pointer font-medium text-zinc-800 marker:text-zinc-500 dark:text-zinc-200 dark:marker:text-zinc-400">
          進階篩選
          <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">（類型、狀態、分組）</span>
        </summary>
        <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              事件類型（未勾選表示全部）
            </legend>
            <div className="flex flex-wrap gap-4">
              {ETYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="inline-flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    name="etype"
                    value={opt.value}
                    defaultChecked={values.types.includes(opt.value)}
                    className="rounded border-zinc-300 dark:border-zinc-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              狀態（未勾選表示全部）
            </legend>
            <div className="flex flex-wrap gap-4">
              {ESTATUS_OPTIONS.map((opt) => (
                <label key={opt.value} className="inline-flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    name="estatus"
                    value={opt.value}
                    defaultChecked={values.statuses.includes(opt.value)}
                    className="rounded border-zinc-300 dark:border-zinc-600"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block max-w-xs space-y-1">
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              參與分組（任一隊員屬該分組即列入）
            </span>
            <select
              name="squad"
              defaultValue={values.squad}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2 dark:border-zinc-600 dark:bg-zinc-900"
            >
              <option value="">全部</option>
              {squads.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            套用篩選
          </button>
        </div>
      </details>
    </form>
  );
}

export type { CoachEventsListFilterValues } from "@/app/coach/(main)/events/coach-events-list-types";
