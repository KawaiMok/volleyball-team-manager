"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useCapacitorNative } from "@/hooks/use-capacitor-native";

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
  /** 依內容高度（註解：切換隊伍等短列表，避免 sheet 撐滿螢幕） */
  fitContent?: boolean;
};

/**
 * 手機 bottom sheet / 桌機居中 modal（註解：portal 至 body，避免被頂欄裁切）。
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
  fitContent = false,
}: BottomSheetProps) {
  const native = useCapacitorNative();
  const [mounted, setMounted] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!open || !mounted) return null;

  /** 可視高度上限（註解：svh/dvh 雙保險，相容舊版 Safari）。 */
  const viewportCap = "min(100dvh, 100svh, 100vh)";
  const safeTop = "env(safe-area-inset-top, 0px)";
  const safeBottom = "env(safe-area-inset-bottom, 0px)";
  const viewportSafe = `calc(${viewportCap} - ${safeTop} - ${safeBottom})`;

  const maxH =
    fitContent ?
      viewportSafe
    : tall ?
      native ?
        `min(calc(92dvh - 4.5rem - ${safeBottom}), calc(92svh - 4.5rem - ${safeBottom}), 820px)`
      : `min(calc(92dvh - ${safeTop} - ${safeBottom}), calc(92svh - ${safeTop} - ${safeBottom}), 880px)`
    : native ?
      `min(calc(88dvh - 4.5rem - ${safeBottom}), calc(88svh - 4.5rem - ${safeBottom}), 600px)`
    : `min(calc(85dvh - ${safeTop} - ${safeBottom}), calc(85svh - ${safeTop} - ${safeBottom}), 640px)`;

  /** 內容區額外上限（註解：fitContent 時列表過長仍可捲動）。 */
  const contentMaxH =
    fitContent ? `calc(${viewportCap} - ${safeTop} - ${safeBottom} - 7rem)` : undefined;

  const nativeTabLift =
    native ?
      "mb-[calc(4.25rem+env(safe-area-inset-bottom))] max-sm:rounded-b-xl sm:mb-0"
    : "max-sm:pb-[env(safe-area-inset-bottom,0px)]";

  const gridRows =
    fitContent ?
      footer ?
        "auto auto auto"
      : "auto auto"
    : footer ?
      "auto minmax(0, 1fr) auto"
    : "auto minmax(0, 1fr)";

  const sheet = (
    <div
      className="fixed inset-0 z-[120] flex h-[100dvh] max-h-[100svh] items-end justify-center overflow-hidden sm:items-center sm:p-4"
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
        className={`relative z-10 grid w-full max-w-lg overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:max-h-[min(640px,90vh)] sm:rounded-2xl sm:w-[calc(100%-2rem)] bottom-sheet-enter ${nativeTabLift}`}
        style={{
          maxHeight: maxH,
          gridTemplateRows: gridRows,
        }}
      >
        <div>
          <div className="flex justify-center pt-2 sm:hidden" aria-hidden>
            <span className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          </div>
          <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
            <div className="min-w-0 flex-1">
              <h3 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {title}
              </h3>
              {subtitle ?
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
              : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
              aria-label="關閉"
            >
              <span className="text-xl leading-none">×</span>
            </button>
          </div>
        </div>
        <div
          className="min-h-0 overflow-y-auto overscroll-contain px-5 py-4 touch-pan-y"
          style={contentMaxH ? { maxHeight: contentMaxH } : undefined}
        >
          {children}
        </div>
        {footer ?
          <div className="border-t border-zinc-100 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-zinc-800 sm:pb-4">
            {footer}
          </div>
        : null}
      </div>
    </div>
  );

  return createPortal(sheet, document.body);
}
