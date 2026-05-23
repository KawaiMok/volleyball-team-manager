"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  title: string;
  children: React.ReactNode;
  /** 全屏浮動控制區（註解：預設收起；教練端傳入工具＋儲存）。 */
  fullscreenControls?: React.ReactNode;
  /** 全屏時永遠顯示的快捷按鈕（註解：例如「儲存」，不需展開工具列）。 */
  fullscreenQuickActions?: React.ReactNode;
};

/**
 * 戰術板橫向全屏外殼（註解：球場盡量填滿視窗；控制項為浮動可收起面板）。
 */
export function CourtBoardFullscreenShell({
  title,
  children,
  fullscreenControls,
  fullscreenQuickActions,
}: Props) {
  const [open, setOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const close = useCallback(() => {
    setOpen(false);
    setControlsOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (controlsOpen) setControlsOpen(false);
        else close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, controlsOpen]);

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

  const safeStyle = {
    paddingTop: "max(0.25rem, env(safe-area-inset-top))",
    paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))",
    paddingLeft: "max(0.25rem, env(safe-area-inset-left))",
    paddingRight: "max(0.25rem, env(safe-area-inset-right))",
  } as const;

  return (
    <div className="space-y-2">
      {!open ?
        <div className="flex justify-end">{expandButton}</div>
      : null}

      <div
        className={
          open ?
            "fixed inset-0 z-[100] bg-zinc-950"
          : "relative mx-auto max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-inner dark:border-zinc-800 dark:bg-zinc-900 md:max-w-lg"
        }
        style={open ? safeStyle : undefined}
      >
        {open ?
          <>
            {/* 戰術板：盡量填滿視窗（2:1），不受工具列擠壓 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="aspect-[2/1] w-[min(calc(100vw-0.5rem),calc((100vh-0.5rem)*2))] max-h-[calc(100vh-0.5rem)] touch-none">
                {children}
              </div>
            </div>

            <button
              type="button"
              onClick={close}
              className="absolute z-20 rounded-full border border-zinc-600/80 bg-zinc-900/90 px-3 py-1.5 text-sm font-medium text-zinc-100 shadow-lg backdrop-blur-sm hover:bg-zinc-800"
              style={{
                top: "max(0.5rem, env(safe-area-inset-top))",
                right: "max(0.5rem, env(safe-area-inset-right))",
              }}
              aria-label="關閉全屏"
            >
              關閉
            </button>

            {(fullscreenControls || fullscreenQuickActions) ?
              <div
                className="absolute z-20 flex max-w-[calc(100vw-1rem)] flex-col items-end gap-2"
                style={{
                  bottom: "max(0.5rem, env(safe-area-inset-bottom))",
                  right: "max(0.5rem, env(safe-area-inset-right))",
                  left: "max(0.5rem, env(safe-area-inset-left))",
                }}
              >
                {controlsOpen && fullscreenControls ?
                  <div className="w-full max-w-md self-end rounded-xl border border-zinc-700/80 bg-zinc-900/95 p-2 shadow-xl backdrop-blur-md">
                    {fullscreenControls}
                  </div>
                : null}

                <div className="flex flex-wrap items-center justify-end gap-2 self-end">
                  {fullscreenQuickActions}
                  {fullscreenControls ?
                    <button
                      type="button"
                      onClick={() => setControlsOpen((v) => !v)}
                      className="rounded-full border border-zinc-600/80 bg-zinc-900/90 px-3 py-1.5 text-sm font-medium text-zinc-100 shadow-lg backdrop-blur-sm hover:bg-zinc-800"
                      aria-expanded={controlsOpen}
                    >
                      {controlsOpen ? "收起工具" : "工具"}
                    </button>
                  : null}
                </div>
              </div>
            : null}
          </>
        : (
          <div className="w-full touch-none">{children}</div>
        )}
      </div>
    </div>
  );
}
