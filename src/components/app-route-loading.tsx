"use client";

import { AppLogo } from "@/components/brand/app-logo";
import { useCapacitorNative } from "@/hooks/use-capacitor-native";

/**
 * 路由載入中畫面（註解：Web 用 skeleton；Capacitor 用頂部 pulse + mascot，不整屏替換）。
 */
export function AppRouteLoading({
  variant = "neutral",
  style = "default",
}: {
  variant?: "neutral" | "coach" | "player";
  /** 載入過渡樣式（註解：事件詳情頁在儲存後 refresh 延遲時，用 avatar skeleton 讓畫面更穩）。 */
  style?: "default" | "avatar";
}) {
  const native = useCapacitorNative();

  const bg = "bg-[var(--app-page-bg)]";

  if (native) {
    return (
      <div className={`relative min-h-[40vh] w-full ${bg}`} role="status" aria-busy aria-live="polite">
        <div
          className="native-loading-bar pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-[199] h-0.5 bg-[var(--brand-primary)]"
          aria-hidden
        />
        <div className="flex justify-center pt-16">
          <AppLogo variant="mascot" size={72} animated />
        </div>
      </div>
    );
  }

  if (style === "avatar") {
    return (
      <div
        className={`flex min-h-[50vh] w-full flex-col items-center justify-center px-6 py-12 ${bg}`}
        role="status"
        aria-busy
        aria-live="polite"
      >
        <div className="flex w-full max-w-md flex-col items-center gap-5">
          <div className="flex w-full items-center gap-4 rounded-2xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-900/60">
            <div className="h-12 w-12 animate-pulse rounded-full bg-zinc-200/90 dark:bg-zinc-700/80" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-2/3 animate-pulse rounded-md bg-zinc-200/90 dark:bg-zinc-700/80" />
              <div className="h-2.5 w-1/2 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
          <p className="text-sm font-medium text-[var(--app-text-muted)]">載入中…</p>
          <div className="w-full space-y-2">
            <div className="h-2.5 w-full animate-pulse rounded-md bg-zinc-200/90 dark:bg-zinc-700/80" />
            <div className="h-2.5 w-4/5 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-2.5 w-3/5 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-[50vh] w-full flex-col items-center justify-center px-6 py-12 ${bg}`}
      role="status"
      aria-busy
      aria-live="polite"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-5">
        <AppLogo variant="mascot" size={56} animated />
        <p className="text-sm font-medium text-[var(--app-text-muted)]">載入中…</p>
        <div className="w-full space-y-2">
          <div className="h-2.5 w-full animate-pulse rounded-md bg-zinc-200/90 dark:bg-zinc-700/80" />
          <div className="h-2.5 w-4/5 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}
