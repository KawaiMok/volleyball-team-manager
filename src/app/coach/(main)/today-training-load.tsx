import Link from "next/link";

import type { FatigueLevel, PainLevel } from "@/generated/prisma/client";

export type TodayTrainingEventBrief = { id: string; title: string };

type Props = {
  trainings: TodayTrainingEventBrief[];
  feedbackCount: number;
  avgRpe: number | null;
  fatigue: Record<FatigueLevel, number>;
  pain: Record<PainLevel, number>;
};

function pct(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/** 教練總覽：今日訓練回饋簡易儀表（註解：對應規格 A1）。 */
export function CoachTodayTrainingLoadSection({
  trainings,
  feedbackCount,
  avgRpe,
  fatigue,
  pain,
}: Props) {
  const n = feedbackCount;
  const fatigueTotal = fatigue.LOW + fatigue.MED + fatigue.HIGH;
  const painTotal = pain.NONE + pain.MILD + pain.SEVERE;

  return (
    <section className="rounded-lg border border-violet-200 bg-gradient-to-br from-violet-50/90 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-violet-900/90">今日訓練 · 身體回饋</h2>
          <p className="mt-0.5 text-xs text-violet-800/80">
            僅統計<strong className="font-medium">今日日曆</strong>上、已發布之<strong>訓練</strong>場次；球員於事件結束後提交。
          </p>
        </div>
        {trainings.length > 0 ?
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-900">
            {trainings.length} 場訓練
          </span>
        : null}
      </div>

      {trainings.length === 0 ?
        <p className="mt-4 text-sm text-zinc-600">今日尚無已發布訓練場次。</p>
      : n === 0 ?
        <p className="mt-4 text-sm text-zinc-600">
          今日場次尚無回饋資料。事件結束後球員可填寫；亦可至{" "}
          {trainings.map((t, i) => (
            <span key={t.id}>
              {i > 0 ? "、" : ""}
              <Link href={`/coach/events/${t.id}`} className="font-medium text-violet-700 underline">
                {t.title}
              </Link>
            </span>
          ))}
          查看詳情。
        </p>
      : (
        <div className="mt-4 space-y-5">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-zinc-500">回饋筆數</p>
              <p className="text-2xl font-semibold tabular-nums text-zinc-900">{n}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">RPE 平均</p>
              <p className="text-2xl font-semibold tabular-nums text-violet-900">
                {avgRpe != null ? avgRpe.toFixed(1) : "—"}
              </p>
              <p className="text-[10px] text-zinc-500">1–10 自覺強度</p>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-600">疲勞（低／中／高）</p>
            <div className="flex h-8 overflow-hidden rounded-md bg-zinc-100">
              {fatigueTotal === 0 ?
                <div className="flex w-full items-center justify-center text-xs text-zinc-400">無資料</div>
              : (
                <>
                  <div
                    className="flex items-center justify-center bg-emerald-400/90 text-[10px] font-medium text-emerald-950"
                    style={{ width: `${pct(fatigue.LOW, fatigueTotal)}%` }}
                    title={`低 ${fatigue.LOW}`}
                  >
                    {fatigue.LOW > 0 ? `${fatigue.LOW}` : ""}
                  </div>
                  <div
                    className="flex items-center justify-center bg-amber-400/90 text-[10px] font-medium text-amber-950"
                    style={{ width: `${pct(fatigue.MED, fatigueTotal)}%` }}
                    title={`中 ${fatigue.MED}`}
                  >
                    {fatigue.MED > 0 ? `${fatigue.MED}` : ""}
                  </div>
                  <div
                    className="flex items-center justify-center bg-rose-400/90 text-[10px] font-medium text-rose-950"
                    style={{ width: `${pct(fatigue.HIGH, fatigueTotal)}%` }}
                    title={`高 ${fatigue.HIGH}`}
                  >
                    {fatigue.HIGH > 0 ? `${fatigue.HIGH}` : ""}
                  </div>
                </>
              )}
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">
              低 {fatigue.LOW} · 中 {fatigue.MED} · 高 {fatigue.HIGH}
            </p>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-zinc-600">疼痛（無／輕／重）</p>
            <div className="flex h-8 overflow-hidden rounded-md bg-zinc-100">
              {painTotal === 0 ?
                <div className="flex w-full items-center justify-center text-xs text-zinc-400">無資料</div>
              : (
                <>
                  <div
                    className="flex items-center justify-center bg-slate-300/90 text-[10px] font-medium text-slate-900"
                    style={{ width: `${pct(pain.NONE, painTotal)}%` }}
                    title={`無 ${pain.NONE}`}
                  >
                    {pain.NONE > 0 ? `${pain.NONE}` : ""}
                  </div>
                  <div
                    className="flex items-center justify-center bg-orange-400/90 text-[10px] font-medium text-orange-950"
                    style={{ width: `${pct(pain.MILD, painTotal)}%` }}
                    title={`輕微 ${pain.MILD}`}
                  >
                    {pain.MILD > 0 ? `${pain.MILD}` : ""}
                  </div>
                  <div
                    className="flex items-center justify-center bg-red-500/90 text-[10px] font-medium text-white"
                    style={{ width: `${pct(pain.SEVERE, painTotal)}%` }}
                    title={`明顯 ${pain.SEVERE}`}
                  >
                    {pain.SEVERE > 0 ? `${pain.SEVERE}` : ""}
                  </div>
                </>
              )}
            </div>
            <p className="mt-1 text-[10px] text-zinc-500">
              無 {pain.NONE} · 輕 {pain.MILD} · 重 {pain.SEVERE}
            </p>
          </div>

          {trainings.length > 0 ?
            <p className="text-xs text-zinc-500">
              場次：
              {trainings.map((t, i) => (
                <span key={t.id}>
                  {i > 0 ? " · " : ""}
                  <Link href={`/coach/events/${t.id}`} className="text-violet-700 hover:underline">
                    {t.title}
                  </Link>
                </span>
              ))}
            </p>
          : null}
        </div>
      )}
    </section>
  );
}
