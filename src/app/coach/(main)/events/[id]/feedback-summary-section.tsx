"use client";

import { useCallback, useMemo, useState } from "react";

import type { FatigueLevel, PainLevel } from "@/generated/prisma/client";
import {
  FeedbackRpeHistogram,
  FeedbackStackedBar,
} from "@/components/feedback-charts";
import { FeedbackDetailSheet } from "@/components/feedback-detail-sheet";
import { fatigueLabel, painLabel } from "@/lib/feedback-display";

export type FeedbackEntryForCoach = {
  id: string;
  displayName: string;
  rpe: number;
  fatigue: FatigueLevel;
  painLevel: PainLevel;
  painArea: string | null;
  note: string | null;
  submittedAt: Date | string;
};

type Props = {
  eventEndsAt: Date | string;
  entries: FeedbackEntryForCoach[];
  /** 錨點 id（註解：教練事件詳情長頁跳段） */
  anchorId?: string;
};

/** 教練視角：圖表彙總 + 列表；檢視以 popup 顯示圖表與詳情。 */
export function EventFeedbackSummarySection({ eventEndsAt, entries, anchorId }: Props) {
  const [detail, setDetail] = useState<FeedbackEntryForCoach | null>(null);

  const endsAtMs = new Date(eventEndsAt).getTime();
  const eventEnded = Date.now() >= endsAtMs;
  const n = entries.length;
  const avgRpe = n > 0 ? entries.reduce((s, e) => s + e.rpe, 0) / n : null;

  const fatigueBins: Record<FatigueLevel, number> = { LOW: 0, MED: 0, HIGH: 0 };
  const painBins: Record<PainLevel, number> = { NONE: 0, MILD: 0, SEVERE: 0 };
  const rpeCounts = useMemo(() => Array.from({ length: 10 }, () => 0), []);

  for (const e of entries) {
    fatigueBins[e.fatigue]++;
    painBins[e.painLevel]++;
    if (e.rpe >= 1 && e.rpe <= 10) rpeCounts[e.rpe - 1]++;
  }

  const closeDetail = useCallback(() => setDetail(null), []);

  return (
    <section
      id={anchorId}
      className={
        anchorId ?
          "scroll-mt-28 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
        : "rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
      }
    >
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">身體回饋</h2>
      {!eventEnded ?
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          事件尚未結束；球員須在結束後才可提交回饋。以下為目前已送出之資料。
        </p>
      : null}

      {n === 0 ?
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">尚無球員提交回饋。</p>
      : (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <div className="mb-3 flex items-end justify-between gap-2">
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">回饋人數</p>
                  <p className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{n}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">RPE 平均</p>
                  <p className="text-2xl font-semibold tabular-nums text-indigo-700 dark:text-indigo-300">
                    {avgRpe != null ? avgRpe.toFixed(1) : "—"}
                  </p>
                </div>
              </div>
              <FeedbackRpeHistogram counts={rpeCounts} />
            </div>
            <div className="space-y-4 rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
              <FeedbackStackedBar
                title="疲勞分布（低／中／高）"
                segments={[
                  { label: "低", count: fatigueBins.LOW, className: "bg-emerald-400/90 text-emerald-950" },
                  { label: "中", count: fatigueBins.MED, className: "bg-amber-400/90 text-amber-950" },
                  { label: "高", count: fatigueBins.HIGH, className: "bg-rose-400/90 text-rose-950" },
                ]}
              />
              <FeedbackStackedBar
                title="疼痛分布（無／輕微／明顯）"
                segments={[
                  { label: "無", count: painBins.NONE, className: "bg-slate-300/90 text-slate-900" },
                  { label: "輕", count: painBins.MILD, className: "bg-orange-400/90 text-orange-950" },
                  { label: "重", count: painBins.SEVERE, className: "bg-red-500/90 text-white" },
                ]}
              />
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[16rem] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                  <th className="py-2 pr-3 font-medium">球員</th>
                  <th className="py-2 pr-3 font-medium">RPE</th>
                  <th className="py-2 pr-3 font-medium">疲勞</th>
                  <th className="py-2 pr-3 font-medium">疼痛</th>
                  <th className="py-2 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="py-2.5 pr-3 font-medium text-zinc-900 dark:text-zinc-50">{row.displayName}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{row.rpe}</td>
                    <td className="py-2.5 pr-3">{fatigueLabel(row.fatigue)}</td>
                    <td className="py-2.5 pr-3">{painLabel(row.painLevel)}</td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => setDetail(row)}
                        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        檢視
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {detail ?
        <FeedbackDetailSheet
          open
          onClose={closeDetail}
          title="身體回饋"
          data={{ ...detail, displayName: detail.displayName }}
        />
      : null}
    </section>
  );
}
