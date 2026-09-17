import type { EventStatusKey } from "@/components/domain-status-indicators";
import { formatDateTimeZh } from "@/lib/format-datetime";

/** 事件類型（註解：與 Prisma EventType 字串一致，client 安全）。 */
export type CoachEventTypeKey = "TRAINING" | "MATCH" | "FITNESS_TEST" | "OTHER";

/** 列表篩選表單值 */
export type CoachEventsListFilterValues = {
  q: string;
  fromYmd: string;
  toYmd: string;
  types: CoachEventTypeKey[];
  statuses: EventStatusKey[];
  squad: string;
};

export type CoachEventListRow = {
  id: string;
  title: string;
  type: CoachEventTypeKey;
  status: EventStatusKey;
  startsAt: Date | string;
  endsAt: Date | string;
  locationName: string | null;
};

/** 列表用精簡類型標籤 */
export function coachEventTypeLabelShort(t: CoachEventTypeKey): string {
  switch (t) {
    case "TRAINING":
      return "訓練";
    case "MATCH":
      return "比賽";
    case "FITNESS_TEST":
      return "體能";
    default:
      return "其他";
  }
}

/** 列表用精簡時間（註解：不含年）。 */
export function formatCoachEventListTimeCompact(date: Date): string {
  return formatDateTimeZh(date, {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 已結束事件列表用 */
export function formatCoachEventEndedListCompact(startsAt: Date): string {
  return formatDateTimeZh(startsAt, {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
