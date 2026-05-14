import { Prisma } from "@/generated/prisma/client";

import type { TrainingPlanWriteInput } from "@/lib/training-plan-schemas";

type Tx = Prisma.TransactionClient;

function blocksToCreateMany(
  planId: string,
  blocks: TrainingPlanWriteInput["blocks"],
): Prisma.TrainingBlockCreateManyInput[] {
  return blocks.map((b, index) => ({
    planId,
    order: b.order ?? index,
    name: b.name,
    minutes: b.minutes,
    goal: b.goal,
    setup: b.setup ?? undefined,
    steps: b.steps,
    coachCues: b.coachCues ?? undefined,
    groupingPlan: b.groupingPlan ?? undefined,
  }));
}

/**
 * 建立訓練計畫（註解：若 event 已有 plan 則丟錯由呼叫端轉 409）。
 */
export async function createTrainingPlan(
  tx: Tx,
  args: {
    teamId: string;
    eventId: string;
    memberId: string;
    data: TrainingPlanWriteInput;
  },
): Promise<void> {
  const plan = await tx.trainingPlan.create({
    data: {
      teamId: args.teamId,
      eventId: args.eventId,
      createdByMemberId: args.memberId,
      updatedByMemberId: args.memberId,
      title: args.data.title ?? undefined,
      summary: args.data.summary ?? undefined,
      equipmentList: args.data.equipmentList ?? undefined,
      safetyNotes: args.data.safetyNotes ?? undefined,
    },
  });
  await tx.trainingBlock.createMany({
    data: blocksToCreateMany(plan.id, args.data.blocks),
  });
}

/**
 * 整份取代：更新 plan 本文並刪除舊 blocks 後重建（註解：給 PUT 與 AI 寫入用）。
 */
export async function upsertTrainingPlanReplaceBlocks(
  tx: Tx,
  args: {
    teamId: string;
    eventId: string;
    memberId: string;
    data: TrainingPlanWriteInput;
    aiProvenance?: Prisma.InputJsonValue;
  },
): Promise<void> {
  const plan = await tx.trainingPlan.upsert({
    where: { eventId: args.eventId },
    create: {
      teamId: args.teamId,
      eventId: args.eventId,
      createdByMemberId: args.memberId,
      updatedByMemberId: args.memberId,
      title: args.data.title ?? undefined,
      summary: args.data.summary ?? undefined,
      equipmentList: args.data.equipmentList ?? undefined,
      safetyNotes: args.data.safetyNotes ?? undefined,
      aiProvenance: args.aiProvenance ?? undefined,
    },
    update: {
      title: args.data.title ?? undefined,
      summary: args.data.summary ?? undefined,
      equipmentList: args.data.equipmentList ?? undefined,
      safetyNotes: args.data.safetyNotes ?? undefined,
      updatedByMemberId: args.memberId,
      ...(args.aiProvenance !== undefined ? { aiProvenance: args.aiProvenance } : {}),
    },
  });

  await tx.trainingBlock.deleteMany({ where: { planId: plan.id } });
  await tx.trainingBlock.createMany({
    data: blocksToCreateMany(plan.id, args.data.blocks),
  });
}
