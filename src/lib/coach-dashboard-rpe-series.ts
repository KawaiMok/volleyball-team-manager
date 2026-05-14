import { addDays, startOfDay, toYmd } from "@/app/coach/(main)/calendar/calendar-utils";

/** 單日 RPE 彙總點（註解：供總覽趨勢圖）。 */
export type DailyRpePoint = {
  ymd: string;
  label: string;
  avgRpe: number | null;
  count: number;
};

/**
 * 依本機日曆日彙總每日平均 RPE（註解：含無資料日，avgRpe 為 null）。
 */
export function buildDailyRpeSeries(
  rows: { submittedAt: Date; rpe: number }[],
  anchorToday: Date,
  numDays: number,
): DailyRpePoint[] {
  const end = startOfDay(anchorToday);
  const first = addDays(end, -(numDays - 1));
  const map = new Map<string, { sum: number; n: number }>();
  for (const r of rows) {
    const d = startOfDay(r.submittedAt);
    const key = toYmd(d);
    const cur = map.get(key);
    if (cur) {
      cur.sum += r.rpe;
      cur.n += 1;
    } else {
      map.set(key, { sum: r.rpe, n: 1 });
    }
  }

  const out: DailyRpePoint[] = [];
  for (let i = 0; i < numDays; i++) {
    const d = addDays(first, i);
    const ymd = toYmd(d);
    const agg = map.get(ymd);
    out.push({
      ymd,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      avgRpe: agg && agg.n > 0 ? Math.round((agg.sum / agg.n) * 10) / 10 : null,
      count: agg?.n ?? 0,
    });
  }
  return out;
}
