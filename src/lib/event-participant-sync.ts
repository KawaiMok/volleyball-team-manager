import type { Prisma } from "@/generated/prisma/client";

/**
 * 將事件的參與者與出席列同步為新名單（註解：移除者刪除 Participant／Attendance／Feedback；新增者建立預設出席）。
 */
export async function syncEventParticipantsToMemberIds(
  tx: Prisma.TransactionClient,
  eventId: string,
  newMemberIds: string[],
): Promise<void> {
  const currentRows = await tx.eventParticipant.findMany({
    where: { eventId },
    select: { memberId: true },
  });
  const currentSet = new Set(currentRows.map((r) => r.memberId));
  const newSet = new Set(newMemberIds);
  const toRemove = [...currentSet].filter((id) => !newSet.has(id));
  const toAdd = [...newSet].filter((id) => !currentSet.has(id));

  if (toRemove.length > 0) {
    await tx.feedback.deleteMany({
      where: { eventId, memberId: { in: toRemove } },
    });
    await tx.attendance.deleteMany({
      where: { eventId, memberId: { in: toRemove } },
    });
    await tx.eventParticipant.deleteMany({
      where: { eventId, memberId: { in: toRemove } },
    });
  }

  if (toAdd.length > 0) {
    await tx.eventParticipant.createMany({
      data: toAdd.map((memberId) => ({ eventId, memberId })),
      skipDuplicates: true,
    });
    await tx.attendance.createMany({
      data: toAdd.map((memberId) => ({ eventId, memberId })),
      skipDuplicates: true,
    });
  }
}
