"use client";

import { AppLogo } from "@/components/brand/app-logo";
import { useCapacitorNative } from "@/hooks/use-capacitor-native";

/**
 * 路由載入中畫面（註解：Web 用 skeleton；Capacitor 用頂部 pulse + mascot，不整屏替換）。
 */
export function AppRouteLoading({
  variant = "neutral",
}: {
  variant?: "neutral" | "coach" | "player";
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
