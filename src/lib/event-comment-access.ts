import type { Event, TeamMember } from "@/generated/prisma/client";
import { EventStatus } from "@/generated/prisma/client";

import { isCoachLike, isPlayer, isStaff } from "@/lib/rbac";

/** 教練／隊務：同隊事件皆可讀留言（含草稿）（註解：與教練端詳情一致）。 */
export function canReadEventCommentsAsCoachSide(member: TeamMember | null): boolean {
  if (!member || member.status !== "ACTIVE") return false;
  return isCoachLike(member) || isStaff(member);
}

/** 球員：僅已發布且為參與者可讀（註解：與球員事件詳情查詢一致）。 */
export function canReadEventCommentsAsPlayer(
  member: TeamMember | null,
  event: Pick<Event, "status">,
  isParticipant: boolean,
): boolean {
  if (!member || member.status !== "ACTIVE") return false;
  if (!isPlayer(member)) return false;
  return event.status === EventStatus.PUBLISHED && isParticipant;
}

/** 可發布公告／完整留言權限（註解：管理員、教練、隊務）。 */
export function canManageEventCommentsAsStaff(member: TeamMember | null): boolean {
  if (!member || member.status !== "ACTIVE") return false;
  return isCoachLike(member) || isStaff(member);
}
