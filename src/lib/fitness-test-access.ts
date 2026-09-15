import type { TeamMember } from "@/generated/prisma/client";
import { EventStatus, EventType } from "@/generated/prisma/client";
import { isCoachLike } from "@/lib/rbac";
import { isPlayerReviewWindowOpen } from "@/lib/player-review-access";

/** 教練是否可開始登錄體能測試（註解：已發布且已到開始時間；進行中與結束後皆可）。 */
export function isFitnessTestCoachEntryOpen(args: {
  status: EventStatus;
  startsAt: Date;
  now?: Date;
}): boolean {
  if (args.status !== EventStatus.PUBLISHED) return false;
  const now = args.now ?? new Date();
  return args.startsAt.getTime() <= now.getTime();
}

/** 是否可登錄／編輯體能測試（註解：FITNESS_TEST + 已發布 + 已開始 + 教練端）。 */
export function canManageFitnessTest(
  member: TeamMember | null,
  event: {
    type: EventType;
    status: EventStatus;
    startsAt: Date;
    endsAt: Date;
  },
): boolean {
  if (!isCoachLike(member)) return false;
  if (event.type !== EventType.FITNESS_TEST) return false;
  if (event.status === EventStatus.CANCELLED) return false;
  return isFitnessTestCoachEntryOpen(event);
}

/** 球員是否可讀取自己的體能測試（註解：事件已結束且已發布）。 */
export function canReadOwnFitnessTest(event: {
  type: EventType;
  status: Parameters<typeof isPlayerReviewWindowOpen>[0]["status"];
  endsAt: Date;
}): boolean {
  if (event.type !== EventType.FITNESS_TEST) return false;
  return isPlayerReviewWindowOpen(event);
}
