import type { Event, TeamMember } from "@/generated/prisma/client";
import { EventStatus, EventType } from "@/generated/prisma/client";
import { isCoachLike, isPlayer, isStaff } from "@/lib/rbac";

/** 僅訓練類型事件可有訓練計畫（註解：比賽/其他拒絕）。 */
export function assertTrainingEvent(event: Event): void {
  if (event.type !== EventType.TRAINING) {
    throw new Error("TRAINING_ONLY");
  }
}

/** 可讀取訓練計畫（註解：教練/隊務看同隊；球員僅已發布且為參與者）。 */
export function canViewTrainingPlan(
  member: TeamMember,
  event: Event & { participants?: { memberId: string }[] },
): boolean {
  if (member.teamId !== event.teamId) return false;
  if (isCoachLike(member) || isStaff(member)) return true;
  if (!isPlayer(member)) return false;
  const isParticipant = event.participants?.some((p) => p.memberId === member.id) ?? false;
  return isParticipant && event.status === EventStatus.PUBLISHED;
}

/** 可建立／更新／刪除訓練計畫（註解：Admin/Coach/Staff）。 */
export function canMutateTrainingPlan(member: TeamMember, event: Event): boolean {
  if (member.teamId !== event.teamId) return false;
  return isCoachLike(member) || isStaff(member);
}

/** 可呼叫 AI 產生（註解：僅 Admin/Coach，與規格一致）。 */
export function canGenerateTrainingPlanAi(member: TeamMember, event: Event): boolean {
  if (member.teamId !== event.teamId) return false;
  return isCoachLike(member);
}
