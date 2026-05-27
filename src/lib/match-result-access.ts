import type { TeamMember } from "@/generated/prisma/client";
import { EventType } from "@/generated/prisma/client";
import { isCoachLike } from "@/lib/rbac";
import { isPlayerReviewWindowOpen } from "@/lib/player-review-access";

/** 是否可登錄／編輯比賽結果（註解：MATCH + 已發布 + 已結束 + 教練端）。 */
export function canManageMatchResult(
  member: TeamMember | null,
  event: { type: EventType; status: Parameters<typeof isPlayerReviewWindowOpen>[0]["status"]; endsAt: Date },
): boolean {
  if (!isCoachLike(member)) return false;
  if (event.type !== EventType.MATCH) return false;
  return isPlayerReviewWindowOpen(event);
}
