import {
  EventStatus,
  EventType,
  FileAssetCategory,
  MemberStatus,
  Prisma,
} from "@/generated/prisma/client";
import { shiftDateByDays, shiftOptionalDate } from "@/lib/shift-datetime";
import { createTrainingPlan } from "@/lib/training-plan-service";
import type { TrainingPlanWriteInput } from "@/lib/training-plan-schemas";

type Tx = Prisma.TransactionClient;

export type DuplicateEventInput = {
  sourceEventId: string;
  teamId: string;
  actorMemberId: string;
  /** 新事件時間相對來源的平移天數（註解：複製上週訓練通常為 7）。 */
  shiftDays: number;
  copyTrainingPlan?: boolean;
  copyCourtSketch?: boolean;
  copyMediaLinks?: boolean;
};

export class DuplicateEventError extends Error {
  constructor(
    message: string,
    readonly code: "NOT_FOUND" | "NO_PARTICIPANTS" | "RSVP_DEADLINE",
  ) {
    super(message);
    this.name = "DuplicateEventError";
  }
}

/** 複製事件為新草稿（註解：參與者、訓練計畫、企位、戰術／影片連結；不含 RSVP／留言／比賽結果）。 */
export async function duplicateEvent(tx: Tx, input: DuplicateEventInput) {
  const copyTrainingPlan = input.copyTrainingPlan ?? true;
  const copyCourtSketch = input.copyCourtSketch ?? true;
  const copyMediaLinks = input.copyMediaLinks ?? true;

  const source = await tx.event.findFirst({
    where: { id: input.sourceEventId, teamId: input.teamId },
    include: {
      participants: { select: { memberId: true } },
      trainingPlan: { include: { blocks: { orderBy: { order: "asc" } } } },
    },
  });
  if (!source) {
    throw new DuplicateEventError("找不到來源事件", "NOT_FOUND");
  }

  const activeMembers = await tx.teamMember.findMany({
    where: { teamId: input.teamId, status: MemberStatus.ACTIVE },
    select: { id: true },
  });
  const activeSet = new Set(activeMembers.map((m) => m.id));
  const memberIds = source.participants
    .map((p) => p.memberId)
    .filter((id) => activeSet.has(id));
  if (memberIds.length === 0) {
    throw new DuplicateEventError("來源事件的參與者皆已不在籍，無法複製", "NO_PARTICIPANTS");
  }

  const startsAt = shiftDateByDays(source.startsAt, input.shiftDays);
  const endsAt = shiftDateByDays(source.endsAt, input.shiftDays);
  const meetAt = shiftOptionalDate(source.meetAt, input.shiftDays);
  let rsvpDeadlineAt = shiftOptionalDate(source.rsvpDeadlineAt, input.shiftDays);
  if (rsvpDeadlineAt instanceof Date && rsvpDeadlineAt.getTime() > startsAt.getTime()) {
    rsvpDeadlineAt = null;
  }

  const newEvent = await tx.event.create({
    data: {
      teamId: input.teamId,
      type: source.type,
      title: source.title,
      description: source.description,
      startsAt,
      endsAt,
      meetAt: meetAt ?? undefined,
      locationName: source.locationName,
      status: EventStatus.DRAFT,
      rsvpDeadlineAt: rsvpDeadlineAt ?? undefined,
      createdByMemberId: input.actorMemberId,
      courtSketch: copyCourtSketch && source.courtSketch != null ? source.courtSketch : undefined,
    },
  });

  await tx.eventParticipant.createMany({
    data: memberIds.map((memberId) => ({ eventId: newEvent.id, memberId })),
    skipDuplicates: true,
  });
  await tx.attendance.createMany({
    data: memberIds.map((memberId) => ({ eventId: newEvent.id, memberId })),
    skipDuplicates: true,
  });

  if (
    copyTrainingPlan &&
    source.type === EventType.TRAINING &&
    source.trainingPlan &&
    source.trainingPlan.blocks.length > 0
  ) {
    const plan = source.trainingPlan;
    const data: TrainingPlanWriteInput = {
      title: plan.title,
      summary: plan.summary,
      equipmentList: Array.isArray(plan.equipmentList) ?
        (plan.equipmentList as string[])
      : null,
      safetyNotes: plan.safetyNotes,
      blocks: plan.blocks.map((b) => ({
        order: b.order,
        name: b.name,
        minutes: b.minutes,
        goal: b.goal,
        setup: b.setup,
        steps: b.steps as string[],
        coachCues: Array.isArray(b.coachCues) ? (b.coachCues as string[]) : null,
        groupingPlan: b.groupingPlan,
      })),
    };
    await createTrainingPlan(tx, {
      teamId: input.teamId,
      eventId: newEvent.id,
      memberId: input.actorMemberId,
      data,
    });
  }

  if (copyMediaLinks) {
    const assets = await tx.fileAsset.findMany({
      where: {
        eventId: source.id,
        category: { in: [FileAssetCategory.TACTICAL_BOARD, FileAssetCategory.VIDEO] },
      },
    });
    if (assets.length > 0) {
      await tx.fileAsset.createMany({
        data: assets.map((a) => ({
          teamId: input.teamId,
          eventId: newEvent.id,
          uploadedByMemberId: input.actorMemberId,
          kind: a.kind,
          category: a.category,
          url: a.url,
          name: a.name,
          mimeType: a.mimeType,
          sizeBytes: a.sizeBytes,
        })),
      });
    }
  }

  return newEvent;
}
