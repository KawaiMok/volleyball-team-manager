"use client";

import { useDataViewMode } from "@/components/data-view-mode-provider";
import { DATA_VIEW_LABELS, type DataViewMode } from "@/lib/data-view-mode";

type Props = {
  /** 註解：教練 zinc／球員 slate。 */
  variant?: "coach" | "player" | "inline";
  className?: string;
};

/** 表格／圖表切換（註解：全站數據檢視偏好）。 */
export function DataViewModeToggle({ variant = "inline", className = "" }: Props) {
  const { mode, setMode } = useDataViewMode();

  const wrap =
    variant === "coach" ?
      "inline-flex shrink-0 items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100/90 p-1 dark:border-zinc-700 dark:bg-zinc-800/80"
    : variant === "player" ?
      "inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/90 p-1 dark:border-slate-600 dark:bg-slate-800/80"
    : "inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-700 dark:bg-zinc-900";

  function btn(active: boolean) {
    if (active) {
      return variant === "player" ?
          "rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-50"
        : "rounded-md bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-50";
    }
    return "rounded-md px-2.5 py-1 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200";
  }

  function select(next: DataViewMode) {
    if (next !== mode) setMode(next);
  }

  return (
    <div className={`${wrap} ${className}`.trim()} role="group" aria-label="數據檢視模式">
      {(Object.keys(DATA_VIEW_LABELS) as DataViewMode[]).map((id) => (
        <button
          key={id}
          type="button"
          className={btn(mode === id)}
          aria-pressed={mode === id}
          onClick={() => select(id)}
        >
          {DATA_VIEW_LABELS[id]}
        </button>
      ))}
    </div>
  );
}
