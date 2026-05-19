import { MemberStatus, TeamRole } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { recordUserNotification } from "@/lib/push/record-notification";
import { sendPushToUserDevices } from "@/lib/push/send";
import type { PushNotificationPayload } from "@/lib/push/types";

const COACH_SIDE_ROLES: TeamRole[] = [
  TeamRole.ADMIN,
  TeamRole.COACH,
  TeamRole.COACH_PLAYER,
  TeamRole.STAFF,
];

/**
 * 對多個使用者發推播（註解：可排除觸發者本人）。
 */
export async function notifyUserIds(
  userIds: string[],
  payload: PushNotificationPayload,
  options?: { excludeUserId?: string },
) {
  const unique = [...new Set(userIds)].filter((id) => id !== options?.excludeUserId);
  let sent = 0;
  for (const userId of unique) {
    try {
      await recordUserNotification(userId, payload);
    } catch {
      /** 註解：紀錄失敗不阻擋 FCM。 */
    }
    const result = await sendPushToUserDevices(userId, payload);
    sent += result.sent;
  }
  return { recipients: unique.length, sent };
}

/** 隊伍內 ACTIVE 成員的 userId。 */
export async function getActiveTeamUserIds(teamId: string): Promise<string[]> {
  const prisma = getPrisma();
  const rows = await prisma.teamMember.findMany({
    where: { teamId, status: MemberStatus.ACTIVE },
    select: { userId: true },
  });
  return [...new Set(rows.map((r) => r.userId))];
}

/** 教練端角色（含隊務）的 userId。 */
export async function getCoachSideUserIds(teamId: string): Promise<string[]> {
  const prisma = getPrisma();
  const rows = await prisma.teamMember.findMany({
    where: { teamId, status: MemberStatus.ACTIVE, role: { in: COACH_SIDE_ROLES } },
    select: { userId: true },
  });
  return [...new Set(rows.map((r) => r.userId))];
}

/** 事件參與者的 userId。 */
export async function getEventParticipantUserIds(eventId: string): Promise<string[]> {
  const prisma = getPrisma();
  const rows = await prisma.eventParticipant.findMany({
    where: { eventId },
    select: { member: { select: { userId: true } } },
  });
  return [...new Set(rows.map((r) => r.member.userId))];
}

/** 非阻塞推播（註解：API 回應不等待 FCM）。 */
export function dispatchPush(
  work: () => Promise<{ recipients: number; sent: number }>,
): void {
  void work().catch(() => {
    /** 註解：推播失敗不拋出。 */
  });
}
