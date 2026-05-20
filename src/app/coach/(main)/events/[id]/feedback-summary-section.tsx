"use client";

import { useCallback, useEffect, useState } from "react";

import type { FatigueLevel, PainLevel } from "@/generated/prisma/client";
import { formatDateTimeZh } from "@/lib/format-datetime";

function fatigueLabel(f: FatigueLevel) {
  switch (f) {
    case "LOW":
      return "低";
    case "MED":
      return "中";
    case "HIGH":
      return "高";
    default:
      return f;
  }
}

function painLabel(p: PainLevel) {
  switch (p) {
    case "NONE":
      return "無";
    case "MILD":
      return "輕微";
    case "SEVERE":
      return "明顯";
    default:
      return p;
  }
}

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

/** 教練視角：單場回饋彙總 + 精簡列表；詳情以 popup 顯示（註解：對應規格 Event Detail / Feedback）。 */
export function EventFeedbackSummarySection({ eventEndsAt, entries, anchorId }: Props) {
  const [detail, setDetail] = useState<FeedbackEntryForCoach | null>(null);

  const endsAtMs = new Date(eventEndsAt).getTime();
  const now = Date.now();
  const eventEnded = now >= endsAtMs;
  const n = entries.length;
  const avgRpe = n > 0 ? entries.reduce((s, e) => s + e.rpe, 0) / n : null;

  const fatigueBins: Record<FatigueLevel, number> = { LOW: 0, MED: 0, HIGH: 0 };
  const painBins: Record<PainLevel, number> = { NONE: 0, MILD: 0, SEVERE: 0 };
  for (const e of entries) {
    fatigueBins[e.fatigue]++;
    painBins[e.painLevel]++;
  }

  const closeDetail = useCallback(() => setDetail(null), []);

  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [detail, closeDetail]);

  useEffect(() => {
    if (!detail) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [detail]);

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
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 dark:bg-zinc-950">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">回饋人數</div>
              <div className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{n}</div>
            </div>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 dark:bg-zinc-950">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">RPE 平均</div>
              <div className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {avgRpe != null ? avgRpe.toFixed(1) : "—"}
              </div>
            </div>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 sm:col-span-2 lg:col-span-2 dark:bg-zinc-950">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">疲勞（低／中／高）</div>
              <div className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {fatigueBins.LOW}／{fatigueBins.MED}／{fatigueBins.HIGH}
              </div>
            </div>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2 sm:col-span-2 lg:col-span-4 dark:bg-zinc-950">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">疼痛（無／輕微／明顯）</div>
              <div className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {painBins.NONE}／{painBins.MILD}／{painBins.SEVERE}
              </div>
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
                        詳情
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
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-detail-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="關閉"
            onClick={closeDetail}
          />
          <div className="relative z-10 flex max-h-[min(85vh,32rem)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 sm:rounded-2xl">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <div className="min-w-0">
                <h3 id="feedback-detail-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  身體回饋詳情
                </h3>
                <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">{detail.displayName}</p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800"
                aria-label="關閉"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <dl className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4 text-sm text-zinc-800 dark:text-zinc-200">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  RPE
                </dt>
                <dd className="tabular-nums font-medium">{detail.rpe}／10</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  疲勞
                </dt>
                <dd>{fatigueLabel(detail.fatigue)}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  疼痛
                </dt>
                <dd>{painLabel(detail.painLevel)}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  疼痛部位
                </dt>
                <dd>{detail.painArea?.trim() ? detail.painArea : "—"}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  備註
                </dt>
                <dd className="whitespace-pre-wrap break-words text-zinc-700 dark:text-zinc-300">
                  {detail.note?.trim() ? detail.note : "—"}
                </dd>
              </div>
              <div className="flex flex-col gap-0.5 border-t border-zinc-100 pt-3 dark:border-zinc-800 sm:flex-row sm:gap-3">
                <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  送出時間
                </dt>
                <dd className="text-xs text-zinc-600 dark:text-zinc-400">
                  {formatDateTimeZh(new Date(detail.submittedAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
            </dl>
            <div className="shrink-0 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800">
              <button
                type="button"
                onClick={closeDetail}
                className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      : null}
    </section>
  );
}
