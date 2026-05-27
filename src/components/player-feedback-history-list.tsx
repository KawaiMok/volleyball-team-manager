"use client";

import Link from "next/link";
import { useState } from "react";

import { FeedbackDetailSheet } from "@/components/feedback-detail-sheet";
import type { FeedbackDisplayData } from "@/lib/feedback-display";
import { feedbackOneLineSummary } from "@/lib/feedback-display";
import { formatDateTimeZh } from "@/lib/format-datetime";

export type PlayerFeedbackHistoryItem = FeedbackDisplayData & {
  id: string;
  eventId: string;
  eventTitle: string;
  eventStartsAt: string;
  editable: boolean;
  editDeadlineLabel: string | null;
};

type Props = {
  items: PlayerFeedbackHistoryItem[];
};

/** 球員回饋歷史列表（註解：檢視 popup 含圖表）。 */
export function PlayerFeedbackHistoryList({ items }: Props) {
  const [detail, setDetail] = useState<PlayerFeedbackHistoryItem | null>(null);

  if (items.length === 0) {
    return (
      <li className="px-4 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
        尚無回饋紀錄。事件結束後可在該場「身體回饋」區填寫。
      </li>
    );
  }

  return (
    <>
      {items.map((fb) => (
        <li key={fb.id} className="px-4 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <Link
                href={`/player/events/${fb.eventId}`}
                className="font-medium text-slate-900 hover:text-blue-700 hover:underline dark:text-slate-50"
              >
                {fb.eventTitle}
              </Link>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                場次：
                {formatDateTimeZh(new Date(fb.eventStartsAt), { dateStyle: "short", timeStyle: "short" })}
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                {feedbackOneLineSummary(fb)}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
              {fb.editable ?
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-900">
                  可編輯至 {fb.editDeadlineLabel}
                </span>
              : (
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  已鎖定
                </span>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDetail(fb)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-slate-50 dark:border-slate-600 dark:text-indigo-300 dark:hover:bg-zinc-800"
                >
                  檢視
                </button>
                <Link
                  href={`/player/events/${fb.eventId}`}
                  className="rounded-lg px-3 py-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  場次詳情
                </Link>
              </div>
            </div>
          </div>
        </li>
      ))}

      {detail ?
        <FeedbackDetailSheet
          open
          onClose={() => setDetail(null)}
          title="我的身體回饋"
          data={detail}
        />
      : null}
    </>
  );
}
