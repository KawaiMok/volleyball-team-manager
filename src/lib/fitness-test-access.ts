import type { TeamMember } from "@/generated/prisma/client";
import { EventType } from "@/generated/prisma/client";
import { isCoachLike } from "@/lib/rbac";
import { isPlayerReviewWindowOpen } from "@/lib/player-review-access";

/** 是否可登錄／編輯體能測試（註解：FITNESS_TEST + 已發布 + 已結束 + 教練端）。 */
export function canManageFitnessTest(
  member: TeamMember | null,
  event: { type: EventType; status: Parameters<typeof isPlayerReviewWindowOpen>[0]["status"]; endsAt: Date },
): boolean {
  if (!isCoachLike(member)) return false;
  if (event.type !== EventType.FITNESS_TEST) return false;
  return isPlayerReviewWindowOpen(event);
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
