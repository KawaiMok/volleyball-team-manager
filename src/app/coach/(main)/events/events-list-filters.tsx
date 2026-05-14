import Link from "next/link";

import { EventStatus, EventType } from "@/generated/prisma/client";

/** 事件列表篩選表單（註解：GET 查詢字串，可分享連結；與伺服端解析參數一致）。 */
export type CoachEventsListFilterValues = {
  q: string;
  fromYmd: string;
  toYmd: string;
  types: EventType[];
  statuses: EventStatus[];
  squad: string;
};

type Props = {
  values: CoachEventsListFilterValues;
  squads: string[];
  hasActiveFilters: boolean;
};

const ETYPE_OPTIONS: { value: EventType; label: string }[] = [
  { value: EventType.TRAINING, label: "訓練" },
  { value: EventType.MATCH, label: "比賽" },
  { value: EventType.OTHER, label: "其他" },
];

const ESTATUS_OPTIONS: { value: EventStatus; label: string }[] = [
  { value: EventStatus.DRAFT, label: "草稿" },
  { value: EventStatus.PUBLISHED, label: "已發布" },
  { value: EventStatus.CANCELLED, label: "已取消" },
];

export function CoachEventsListFilters({ values, squads, hasActiveFilters }: Props) {
  return (
    <form method="get" action="/coach/events" className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50/80 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[12rem] flex-1 space-y-1">
          <span className="text-xs font-medium text-zinc-600">搜尋（標題／地點）</span>
          <input
            name="q"
            type="search"
            placeholder="關鍵字…"
            defaultValue={values.q}
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
            autoComplete="off"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-600">開始日起</span>
          <input
            name="from"
            type="date"
            defaultValue={values.fromYmd}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs font-medium text-zinc-600">開始日迄</span>
          <input
            name="to"
            type="date"
            defaultValue={values.toYmd}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          套用
        </button>
        {hasActiveFilters ?
          <Link
            href="/coach/events"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            重設
          </Link>
        : null}
      </div>

      <details className="group rounded-md border border-zinc-200 bg-white p-3 text-sm">
        <summary className="cursor-pointer font-medium text-zinc-800 marker:text-zinc-500">
          進階篩選
          <span className="ml-2 font-normal text-zinc-500">（類型、狀態、分組）</span>
        </summary>
        <div className="mt-4 space-y-4 border-t border-zinc-100 pt-4">
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-zinc-600">事件類型（未勾選表示全部）</legend>
            <div className="flex flex-wrap gap-4">
              {ETYPE_OPTIONS.map((opt) => (
                <label key={opt.value} className="inline-flex items-center gap-2 text-zinc-800">
                  <input
                    type="checkbox"
                    name="etype"
                    value={opt.value}
                    defaultChecked={values.types.includes(opt.value)}
                    className="rounded border-zinc-300"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-xs font-medium text-zinc-600">狀態（未勾選表示全部）</legend>
            <div className="flex flex-wrap gap-4">
              {ESTATUS_OPTIONS.map((opt) => (
                <label key={opt.value} className="inline-flex items-center gap-2 text-zinc-800">
                  <input
                    type="checkbox"
                    name="estatus"
                    value={opt.value}
                    defaultChecked={values.statuses.includes(opt.value)}
                    className="rounded border-zinc-300"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="block max-w-xs space-y-1">
            <span className="text-xs font-medium text-zinc-600">參與分組（任一隊員屬該分組即列入）</span>
            <select
              name="squad"
              defaultValue={values.squad}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-400 focus:ring-2"
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
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            套用篩選
          </button>
        </div>
      </details>
    </form>
  );
}
