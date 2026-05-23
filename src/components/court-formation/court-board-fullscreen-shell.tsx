"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  title: string;
  children: React.ReactNode;
  /** 全屏時顯示在頂部列（註解：教練端可放精簡工具列）。 */
  fullscreenTop?: React.ReactNode;
  /** 全屏時顯示在底部列（註解：教練端可放儲存等操作）。 */
  fullscreenBottom?: React.ReactNode;
};

/**
 * 戰術板橫向全屏外殼（註解：同一 SVG 實例切換 fixed overlay；Esc 關閉）。
 */
export function CourtBoardFullscreenShell({
  title,
  children,
  fullscreenTop,
  fullscreenBottom,
}: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const expandButton = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      aria-label={`${title} 橫向全屏`}
    >
      <span aria-hidden className="text-base leading-none">
        ⛶
      </span>
      橫向全屏
    </button>
  );

  const boardFrameClass =
    open ?
      "h-full w-full max-h-full max-w-[min(100vw-2rem,calc((100vh-8rem)*2))] touch-none"
    : "w-full touch-none";

  const boardInner = (
    <div
      className={
        open ?
          "flex min-h-0 flex-1 items-center justify-center p-4 pt-2"
        : ""
      }
    >
      <div className={open ? `aspect-[2/1] ${boardFrameClass}` : boardFrameClass}>{children}</div>
    </div>
  );

  return (
    <div className="space-y-2">
      {!open ?
        <div className="flex justify-end">{expandButton}</div>
      : null}

      <div
        className={
          open ?
            "fixed inset-0 z-[100] flex flex-col bg-zinc-950 text-zinc-50"
          : "relative mx-auto max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-inner dark:border-zinc-800 dark:bg-zinc-900 md:max-w-lg"
        }
        style={
          open ?
            {
              paddingTop: "max(0.75rem, env(safe-area-inset-top))",
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
              paddingLeft: "max(0.75rem, env(safe-area-inset-left))",
              paddingRight: "max(0.75rem, env(safe-area-inset-right))",
            }
          : undefined
        }
      >
        {open ?
          <div className="flex shrink-0 flex-col gap-2 border-b border-zinc-800 px-2 pb-2">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold">{title}</span>
              <button
                type="button"
                onClick={close}
                className="shrink-0 rounded-md border border-zinc-600 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
              >
                關閉
              </button>
            </div>
            {fullscreenTop ?
              <div className="overflow-x-auto">{fullscreenTop}</div>
            : null}
          </div>
        : null}

        {boardInner}

        {open && fullscreenBottom ?
          <div className="shrink-0 border-t border-zinc-800 px-2 pt-2">{fullscreenBottom}</div>
        : null}
      </div>
    </div>
  );
}
