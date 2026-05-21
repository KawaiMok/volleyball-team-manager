import { EventStatus, TeamRole } from "@/generated/prisma/client";
import { isCoachLike, isPlayer } from "@/lib/rbac";

/** 可接受教練私評的隊員角色（註解：純教練／隊務／管理員不在此列）。 */
export function isPlayerReviewSubjectRole(role: TeamRole): boolean {
  return role === TeamRole.PLAYER || role === TeamRole.COACH_PLAYER;
}

/** 教練是否可撰寫／檢視全場私評（註解：含 ADMIN／COACH／COACH_PLAYER）。 */
export function canManagePlayerReviews(member: { role: TeamRole; status: string } | null): boolean {
  return isCoachLike(member as Parameters<typeof isCoachLike>[0]);
}

/** 球員是否可讀取自己的私評（註解：PLAYER／COACH_PLAYER）。 */
export function canReadOwnPlayerReview(member: { role: TeamRole; status: string } | null): boolean {
  return isPlayer(member as Parameters<typeof isPlayer>[0]);
}

/** 私評 API 共用：事件須已發布且已結束（註解：對齊「事件後」撰寫）。 */
export function isPlayerReviewWindowOpen(args: {
  status: EventStatus;
  endsAt: Date;
  now?: Date;
}): boolean {
  const now = args.now ?? new Date();
  if (args.status !== EventStatus.PUBLISHED) return false;
  return args.endsAt.getTime() <= now.getTime();
}
