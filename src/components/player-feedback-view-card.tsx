"use client";

import { useState } from "react";

import { FeedbackDetailSheet } from "@/components/feedback-detail-sheet";
import { FeedbackRpeBar } from "@/components/feedback-charts";
import type { FeedbackDisplayData } from "@/lib/feedback-display";
import { feedbackOneLineSummary } from "@/lib/feedback-display";

type Props = {
  data: FeedbackDisplayData;
  /** 是否仍可編輯（註解：顯示提示文字）。 */
  canEdit?: boolean;
  editHint?: string;
};

/** 球員：已提交回饋的精簡卡片 + 檢視 popup（註解：唯讀或鎖定後）。 */
export function PlayerFeedbackViewCard({ data, canEdit, editHint }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">身體回饋</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {feedbackOneLineSummary(data)}
            </p>
            <div className="mt-3 max-w-xs">
              <FeedbackRpeBar rpe={data.rpe} />
            </div>
            {canEdit && editHint ?
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">{editHint}</p>
            : null}
            {!canEdit ?
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                已超過可編輯時間（送出後 24 小時內可修改）。
              </p>
            : null}
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-slate-50 dark:border-slate-600 dark:text-indigo-300 dark:hover:bg-zinc-800"
          >
            檢視
          </button>
        </div>
      </div>

      <FeedbackDetailSheet open={open} onClose={() => setOpen(false)} data={data} title="我的身體回饋" />
    </>
  );
}
