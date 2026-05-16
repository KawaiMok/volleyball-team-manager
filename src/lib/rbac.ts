import type { TeamMember } from "@/generated/prisma/client";
import { TeamRole } from "@/generated/prisma/client";

/** 教練端：可管理事件、點名、看全隊資料（註解：含 ADMIN、COACH、COACH_PLAYER）。 */
export function isCoachLike(member: TeamMember | null): boolean {
  if (!member || member.status !== "ACTIVE") return false;
  return (
    member.role === TeamRole.ADMIN ||
    member.role === TeamRole.COACH ||
    member.role === TeamRole.COACH_PLAYER
  );
}

/** 隊伍管理員：可指派／調整「管理員」角色與敏感隊伍設定（註解：與教練分權）。 */
export function isTeamAdmin(member: TeamMember | null): boolean {
  if (!member || member.status !== "ACTIVE") return false;
  return member.role === TeamRole.ADMIN;
}

/** 隊務人員：可協助留言/檔案等（註解：M1 先與 COACH 分開判斷，避免權限放太寬）。 */
export function isStaff(member: TeamMember | null): boolean {
  if (!member || member.status !== "ACTIVE") return false;
  return member.role === TeamRole.STAFF;
}

/** 球員端（RSVP、回饋、參與者視角）：PLAYER 與 COACH_PLAYER（註解：純教練需改角色或另設 dual）。 */
export function isPlayer(member: TeamMember | null): boolean {
  if (!member || member.status !== "ACTIVE") return false;
  return member.role === TeamRole.PLAYER || member.role === TeamRole.COACH_PLAYER;
}
