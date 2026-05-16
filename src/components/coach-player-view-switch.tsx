"use client";

import Link from "next/link";

type Props = {
  /** 註解：目前所在端（高亮分頁）。 */
  current: "coach" | "player";
  /**
   * 註解：是否顯示「教練端」入口。
   * 純球員（僅 PLAYER）為 false，且於球員端時父層不應渲染本元件。
   */
  canAccessCoach: boolean;
  /** 註解：配色與教練端／球員端 header 一致。 */
  variant: "coach" | "player";
  /** 註解：點連結後呼叫（例如關閉下拉選單）。 */
  onNavigate?: () => void;
};

/**
 * 教練端／球員端分段切換（註解：COACH_PLAYER、管理員／教練預覽球員、可進雙端者使用）。
 */
export function CoachPlayerViewSwitch({ current, canAccessCoach, variant, onNavigate }: Props) {
  if (current === "player" && !canAccessCoach) {
    return null;
  }

  const wrap =
    variant === "coach" ?
      "inline-flex shrink-0 items-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/90 p-0.5 shadow-sm"
    : "inline-flex shrink-0 items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/90 p-0.5 shadow-sm";

  const activeC =
    variant === "coach" ?
      "rounded-md bg-zinc-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm"
    : "rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm";

  const idleC =
    variant === "coach" ?
      "rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100"
    : "rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100";

  return (
    <div className={wrap} role="tablist" aria-label="教練端與球員端切換">
      <Link
        href="/coach"
        className={current === "coach" ? activeC : idleC}
        aria-current={current === "coach" ? "page" : undefined}
        prefetch
        onClick={() => onNavigate?.()}
      >
        教練端
      </Link>
      <Link
        href="/player"
        className={current === "player" ? activeC : idleC}
        aria-current={current === "player" ? "page" : undefined}
        prefetch
        onClick={() => onNavigate?.()}
      >
        球員端
      </Link>
    </div>
  );
}
