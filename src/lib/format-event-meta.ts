import { formatDateZh, formatTimeZh } from "@/lib/format-datetime";

/** 已結束事件標題旁簡寫：日期、時段、地點（註解：一行顯示）。 */
export function formatEventWhenWhereShort(
  startsAt: Date,
  endsAt: Date,
  locationName?: string | null,
): string {
  const datePart = formatDateZh(startsAt, { month: "numeric", day: "numeric", weekday: "short" });
  const startTime = formatTimeZh(startsAt, { hour: "2-digit", minute: "2-digit" });
  const endTime = formatTimeZh(endsAt, { hour: "2-digit", minute: "2-digit" });
  let text = `${datePart} ${startTime}–${endTime}`;
  const loc = locationName?.trim();
  if (loc) text += ` · ${loc}`;
  return text;
}
