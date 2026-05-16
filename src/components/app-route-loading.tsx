/**
 * 路由載入中畫面（註解：供各層 `loading.tsx` 使用，與教練端／球員端色調一致）。
 */
export function AppRouteLoading({
  variant = "neutral",
}: {
  variant?: "neutral" | "coach" | "player";
}) {
  const bg =
    variant === "coach" ? "bg-zinc-50 dark:bg-zinc-950"
    : variant === "player" ? "bg-slate-50 dark:bg-slate-950"
    : "bg-white dark:bg-zinc-900";

  return (
    <div
      className={`flex min-h-[70vh] w-full flex-col items-center justify-center px-6 py-16 ${bg}`}
      role="status"
      aria-busy
      aria-live="polite"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="relative h-12 w-12">
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-zinc-200 dark:border-zinc-700 border-t-zinc-800 dark:border-t-zinc-200" />
        </div>
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">載入中…</p>
        <div className="w-full space-y-3">
          <div className="h-3 w-full animate-pulse rounded-md bg-zinc-200/90 dark:bg-zinc-700/80" />
          <div className="h-3 w-4/5 animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-3 w-3/5 animate-pulse rounded-md bg-zinc-100/90 dark:bg-zinc-800/80" />
        </div>
      </div>
    </div>
  );
}
