"use client";

import { useCallback, useEffect } from "react";

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  titleId?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** 較高 sheet（註解：編輯表單用） */
  tall?: boolean;
};

/**
 * 手機 bottom sheet / 桌機居中 modal（註解：RN 風格滑入，sm+ 維持 dialog）。
 */
export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  titleId = "bottom-sheet-title",
  children,
  footer,
  tall = false,
}: BottomSheetProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = prev;
    };
  }, [open, handleKey]);

  if (!open) return null;

  const maxH = tall ? "min(92vh,880px)" : "min(88vh,640px)";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        aria-label="關閉"
        onClick={onClose}
      />
      <div
        className={`relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:rounded-2xl bottom-sheet-enter`}
        style={{ maxHeight: maxH }}
      >
        {/* 拖曳把手（註解：手機 sheet 視覺提示） */}
        <div className="flex shrink-0 justify-center pt-2 sm:hidden" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <h3 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {title}
            </h3>
            {subtitle ?
              <p className="mt-1 truncate text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
            : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="關閉"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer ?
          <div className="shrink-0 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">{footer}</div>
        : null}
      </div>
    </div>
  );
}
