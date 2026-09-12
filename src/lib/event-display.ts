import { EventType } from "@/generated/prisma/client";
import { formatDateTimeZh } from "@/lib/format-datetime";

/** 事件類型中文（完整）。 */
export function eventTypeLabel(t: EventType): string {
  switch (t) {
    case EventType.TRAINING:
      return "訓練";
    case EventType.MATCH:
      return "比賽";
    case EventType.FITNESS_TEST:
      return "體能測試";
    default:
      return "其他";
  }
}

/** 事件類型中文（列表窄欄／手機用，註解：避免「體能測試」四字直排）。 */
export function eventTypeLabelShort(t: EventType): string {
  switch (t) {
    case EventType.TRAINING:
      return "訓練";
    case EventType.MATCH:
      return "比賽";
    case EventType.FITNESS_TEST:
      return "體能";
    default:
      return "其他";
  }
}

/** 列表用精簡時間（註解：不含年，例 9/12 六 14:30）。 */
export function formatEventListTimeCompact(date: Date): string {
  return formatDateTimeZh(date, {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 已結束事件列表用（註解：只顯示開始日時，更省寬度）。 */
export function formatEventEndedListCompact(startsAt: Date): string {
  return formatDateTimeZh(startsAt, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
