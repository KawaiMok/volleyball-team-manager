"use client";

import { useCallback, useEffect, useId, useState, type ReactNode } from "react";

type Props = {
  id: string;
  title: ReactNode;
  /** 標題列右側（註解：如 HintExclamationToggle）。 */
  titleExtra?: ReactNode;
  /**
   * 標題列右側元件顯示時機（註解：避免在「摺疊」狀態點擊 `HintExclamationToggle` 造成內容插入標題列下方而破版）。
   * - "open": 只在展開時顯示（預設）
   * - "always": 無論摺疊/展開都顯示
   */
  titleExtraVisibility?: "open" | "always";
  children: ReactNode;
  /** 預設摺疊（註解：事件詳情各卡片初始關閉）。 */
  defaultOpen?: boolean;
};

/** 教練事件詳情：可摺疊區塊（註解：點標題展開；錨點跳轉時自動展開）。 */
export function CoachEventDetailCollapsibleSection({
  id,
  title,
  titleExtra,
  titleExtraVisibility = "open",
  children,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  const openIfHashMatches = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === `#${id}`) setOpen(true);
  }, [id]);

  useEffect(() => {
    openIfHashMatches();
    window.addEventListener("hashchange", openIfHashMatches);
    return () => window.removeEventListener("hashchange", openIfHashMatches);
  }, [openIfHashMatches]);

  return (
    <section
      id={id}
      className="scroll-mt-28 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/** 註解：標題列需要 `flex-wrap`，讓 `HintExclamationToggle` 展開的 panel 用 `basis-full` 正常換行，避免破版。 */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3.5">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 text-left hover:opacity-80"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <h2 className="min-w-0 flex-1 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {title}
          </h2>
          <span
            className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▼
          </span>
        </button>
        {(titleExtraVisibility === "always" || open) && titleExtra ?
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {titleExtra}
          </div>
        : null}
      </div>
      {open ?
        <div id={panelId} className="border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800">
          {children}
        </div>
      : null}
    </section>
  );
}
