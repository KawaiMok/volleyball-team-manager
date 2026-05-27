"use client";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  FeedbackLevelBar,
  FeedbackRpeBar,
} from "@/components/feedback-charts";
import type { FeedbackDisplayData } from "@/lib/feedback-display";
import { formatDateTimeZh } from "@/lib/format-datetime";

type Props = {
  open: boolean;
  onClose: () => void;
  data: FeedbackDisplayData;
  /** popup 標題（註解：教練看球員名、球員看自己回饋）。 */
  title?: string;
};

/** 身體回饋詳情 popup：圖表 + 文字資訊（註解：檢視按鈕觸發）。 */
export function FeedbackDetailSheet({
  open,
  onClose,
  data,
  title = "身體回饋",
}: Props) {
  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={title}
      subtitle={data.displayName}
      titleId="feedback-detail-sheet-title"
      tall
      footer={
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          關閉
        </button>
      }
    >
      <div className="space-y-5">
        <FeedbackRpeBar rpe={data.rpe} />
        <FeedbackLevelBar kind="fatigue" value={data.fatigue} />
        <FeedbackLevelBar kind="pain" value={data.painLevel} />

        <dl className="space-y-3 border-t border-zinc-100 pt-4 text-sm dark:border-zinc-800">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              疼痛部位
            </dt>
            <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">
              {data.painArea?.trim() ? data.painArea : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              備註
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap break-words text-zinc-700 dark:text-zinc-300">
              {data.note?.trim() ? data.note : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              送出時間
            </dt>
            <dd className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
              {formatDateTimeZh(new Date(data.submittedAt), {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </dd>
          </div>
        </dl>
      </div>
    </BottomSheet>
  );
}
