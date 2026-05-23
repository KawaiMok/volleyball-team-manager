import { formatDateTimeZh } from "@/lib/format-datetime";

type Props = {
  content: string;
  authorName: string;
  updatedAt: Date | string;
  eventTitle?: string;
};

/** 球員端：顯示教練對自己的私評（註解：置頂突出卡片；無評語時由父層不渲染）。 */
export function PlayerCoachReviewSection({ content, authorName, updatedAt, eventTitle }: Props) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border-2 border-amber-400/80 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 p-5 shadow-lg ring-1 ring-amber-200/60 dark:border-amber-500/50 dark:from-amber-950/40 dark:via-zinc-900 dark:to-amber-950/20 dark:ring-amber-900/40"
      aria-labelledby="player-coach-review-heading"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-300/20 blur-2xl dark:bg-amber-500/10"
        aria-hidden
      />
      <div className="relative space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
            教練評語
          </span>
          {eventTitle ?
            <span className="text-xs font-medium text-amber-900/70 dark:text-amber-200/80">{eventTitle}</span>
          : null}
        </div>
        <h2
          id="player-coach-review-heading"
          className="sr-only"
        >
          教練評語
        </h2>
        <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-900 dark:text-slate-50">
          {content}
        </p>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {authorName} · 更新於 {formatDateTimeZh(new Date(updatedAt))}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-500">此評語僅你與教練可見。</p>
      </div>
    </section>
  );
}
