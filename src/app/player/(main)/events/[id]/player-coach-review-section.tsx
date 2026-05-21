import { formatDateTimeZh } from "@/lib/format-datetime";

type Props = {
  content: string;
  authorName: string;
  updatedAt: Date | string;
};

/** 球員端：顯示教練對自己的私評（註解：無評語時由父層不渲染）。 */
export function PlayerCoachReviewSection({ content, authorName, updatedAt }: Props) {
  return (
    <section className="space-y-2 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4 dark:border-indigo-900 dark:bg-indigo-950/30">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">教練評語</h2>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
        {content}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {authorName} · 更新於 {formatDateTimeZh(new Date(updatedAt))}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-400">此評語僅你與教練可見。</p>
    </section>
  );
}
