import { MemberStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { sendPushToUserDevices } from "@/lib/push/send";

/**
 * 隊伍事件發布時推播給所有 ACTIVE 隊員／教練（註解：非阻塞；失敗不影響 API）。
 */
export async function notifyTeamEventPublished(teamId: string, eventTitle: string) {
  const prisma = getPrisma();
  const members = await prisma.teamMember.findMany({
    where: { teamId, status: MemberStatus.ACTIVE },
    select: { userId: true },
  });

  const userIds = [...new Set(members.map((m) => m.userId))];
  const payload = {
    title: "新活動通知",
    body: eventTitle,
    data: { type: "event_published", teamId },
  };

  let sent = 0;
  for (const userId of userIds) {
    const result = await sendPushToUserDevices(userId, payload);
    sent += result.sent;
  }

  return { recipients: userIds.length, sent };
}
