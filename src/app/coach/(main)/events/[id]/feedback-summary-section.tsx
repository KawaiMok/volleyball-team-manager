import type { FatigueLevel, PainLevel } from "@/generated/prisma/client";

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
  submittedAt: Date;
};

type Props = {
  eventEndsAt: Date;
  entries: FeedbackEntryForCoach[];
  /** 錨點 id（註解：教練事件詳情長頁跳段） */
  anchorId?: string;
};

/** 教練視角：單場回饋彙總 + 明細（註解：對應規格 Event Detail / Feedback）。 */
export function EventFeedbackSummarySection({ eventEndsAt, entries, anchorId }: Props) {
  const now = Date.now();
  const eventEnded = now >= eventEndsAt.getTime();
  const n = entries.length;
  const avgRpe = n > 0 ? entries.reduce((s, e) => s + e.rpe, 0) / n : null;

  const fatigueBins: Record<FatigueLevel, number> = { LOW: 0, MED: 0, HIGH: 0 };
  const painBins: Record<PainLevel, number> = { NONE: 0, MILD: 0, SEVERE: 0 };
  for (const e of entries) {
    fatigueBins[e.fatigue]++;
    painBins[e.painLevel]++;
  }

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
            <div className="rounded-md border border-zinc-100 bg-zinc-50 dark:bg-zinc-950 px-3 py-2">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">回饋人數</div>
              <div className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{n}</div>
            </div>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 dark:bg-zinc-950 px-3 py-2">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">RPE 平均</div>
              <div className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {avgRpe != null ? avgRpe.toFixed(1) : "—"}
              </div>
            </div>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 sm:col-span-2 lg:col-span-2">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">疲勞（低／中／高）</div>
              <div className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {fatigueBins.LOW}／{fatigueBins.MED}／{fatigueBins.HIGH}
              </div>
            </div>
            <div className="rounded-md border border-zinc-100 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 sm:col-span-2 lg:col-span-4">
              <div className="text-xs text-zinc-500 dark:text-zinc-400">疼痛（無／輕微／明顯）</div>
              <div className="mt-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {painBins.NONE}／{painBins.MILD}／{painBins.SEVERE}
              </div>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  <th className="py-2 pr-4 font-medium">球員</th>
                  <th className="py-2 pr-4 font-medium">RPE</th>
                  <th className="py-2 pr-4 font-medium">疲勞</th>
                  <th className="py-2 pr-4 font-medium">疼痛</th>
                  <th className="py-2 pr-4 font-medium">部位</th>
                  <th className="py-2 pr-4 font-medium">備註</th>
                  <th className="py-2 font-medium">送出時間</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((row) => (
                  <tr key={row.id} className="border-b border-zinc-100">
                    <td className="py-2 pr-4 font-medium text-zinc-900 dark:text-zinc-50">{row.displayName}</td>
                    <td className="py-2 pr-4 tabular-nums">{row.rpe}</td>
                    <td className="py-2 pr-4">{fatigueLabel(row.fatigue)}</td>
                    <td className="py-2 pr-4">{painLabel(row.painLevel)}</td>
                    <td className="py-2 pr-4 text-zinc-600 dark:text-zinc-400">{row.painArea ?? "—"}</td>
                    <td className="py-2 pr-4 max-w-[14rem] whitespace-pre-wrap break-words text-zinc-600 dark:text-zinc-400">
                      {row.note ?? "—"}
                    </td>
                    <td className="py-2 whitespace-nowrap text-xs text-zinc-500 dark:text-zinc-400">
                      {row.submittedAt.toLocaleString("zh-TW")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
