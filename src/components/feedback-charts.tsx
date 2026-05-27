"use client";

import type { FatigueLevel, PainLevel } from "@/generated/prisma/client";
import {
  fatigueLabel,
  painLabel,
  pct,
} from "@/lib/feedback-display";

/** RPE 1–10 刻度條（註解：個人詳情圖表）。 */
export function FeedbackRpeBar({ rpe, max = 10 }: { rpe: number; max?: number }) {
  const clamped = Math.min(max, Math.max(1, rpe));
  const widthPct = (clamped / max) * 100;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-zinc-500 dark:text-zinc-400">RPE 自覺強度</span>
        <span className="font-semibold tabular-nums text-indigo-700 dark:text-indigo-300">
          {clamped}／{max}
        </span>
      </div>
      <div className="relative h-3 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all"
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] tabular-nums text-zinc-400">
        <span>1</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

/** 三級指標條：疲勞或疼痛（註解：高亮目前等級）。 */
export function FeedbackLevelBar({
  kind,
  value,
}: {
  kind: "fatigue" | "pain";
  value: FatigueLevel | PainLevel;
}) {
  const labels =
    kind === "fatigue" ?
      (["低", "中", "高"] as const)
    : (["無", "輕微", "明顯"] as const);
  const activeIndex =
    kind === "fatigue" ?
      value === "LOW" ? 0
      : value === "MED" ? 1
      : 2
    : value === "NONE" ? 0
    : value === "MILD" ? 1
    : 2;
  const colors =
    kind === "fatigue" ?
      ["bg-emerald-400/90", "bg-amber-400/90", "bg-rose-400/90"]
    : ["bg-slate-300/90", "bg-orange-400/90", "bg-red-500/90"];

  return (
    <div>
      <p className="mb-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        {kind === "fatigue" ? "疲勞程度" : "疼痛程度"}
      </p>
      <div className="flex h-9 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {labels.map((label, i) => (
          <div
            key={label}
            className={`flex flex-1 items-center justify-center text-xs font-medium transition-opacity ${
              colors[i]
            } ${i === activeIndex ? "opacity-100 ring-2 ring-inset ring-zinc-900/20" : "opacity-35"}`}
          >
            {label}
          </div>
        ))}
      </div>
      <p className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
        {kind === "fatigue" ? fatigueLabel(value as FatigueLevel) : painLabel(value as PainLevel)}
      </p>
    </div>
  );
}

/** 堆疊分布條（註解：全隊疲勞／疼痛統計）。 */
export function FeedbackStackedBar({
  title,
  segments,
}: {
  title: string;
  segments: Array<{ label: string; count: number; className: string }>;
}) {
  const total = segments.reduce((s, x) => s + x.count, 0);

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">{title}</p>
      <div className="flex h-8 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
        {total === 0 ?
          <div className="flex w-full items-center justify-center text-xs text-zinc-400">無資料</div>
        : segments.map((seg) =>
            seg.count > 0 ?
              <div
                key={seg.label}
                className={`flex items-center justify-center text-[10px] font-medium ${seg.className}`}
                style={{ width: `${pct(seg.count, total)}%` }}
                title={`${seg.label} ${seg.count}`}
              >
                {seg.count}
              </div>
            : null,
          )}
      </div>
      <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400">
        {segments.map((s) => `${s.label} ${s.count}`).join(" · ")}
      </p>
    </div>
  );
}

/** 全隊 RPE 分布直方圖（註解：1–10 各幾人）。 */
export function FeedbackRpeHistogram({ counts }: { counts: number[] }) {
  const max = Math.max(...counts, 1);
  const total = counts.reduce((s, c) => s + c, 0);

  return (
    <div>
      <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">RPE 分布（1–10）</p>
      <div className="flex h-24 items-end gap-1">
        {counts.map((c, i) => {
          const rpe = i + 1;
          const h = c > 0 ? Math.max(12, (c / max) * 100) : 4;
          return (
            <div key={rpe} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[10px] tabular-nums text-zinc-500">{c > 0 ? c : ""}</span>
              <div
                className={`w-full rounded-t ${c > 0 ? "bg-indigo-500" : "bg-zinc-200 dark:bg-zinc-700"}`}
                style={{ height: `${h}%` }}
                title={`RPE ${rpe}：${c} 人`}
              />
              <span className="text-[10px] tabular-nums text-zinc-400">{rpe}</span>
            </div>
          );
        })}
      </div>
      {total === 0 ?
        <p className="mt-1 text-xs text-zinc-400">尚無資料</p>
      : null}
    </div>
  );
}
