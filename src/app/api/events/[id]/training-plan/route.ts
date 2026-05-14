import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import {
  assertTrainingEvent,
  canMutateTrainingPlan,
  canViewTrainingPlan,
} from "@/lib/training-plan-access";
import { trainingPlanWriteSchema } from "@/lib/training-plan-schemas";
import { createTrainingPlan, upsertTrainingPlanReplaceBlocks } from "@/lib/training-plan-service";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

async function loadEventWithParticipants(prisma: ReturnType<typeof getPrisma>, id: string, teamId: string) {
  return prisma.event.findFirst({
    where: { id, teamId },
    include: { participants: { select: { memberId: true } } },
  });
}

/** 取得訓練計畫（註解：內嵌於事件詳情亦可，此路由方便單獨快取／呼叫）。 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await loadEventWithParticipants(prisma, eventId, member.teamId);
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  try {
    assertTrainingEvent(event);
  } catch {
    return NextResponse.json({ error: "僅訓練事件可有訓練計畫" }, { status: 400 });
  }
  if (!canViewTrainingPlan(member, event)) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  const plan = await prisma.trainingPlan.findUnique({
    where: { eventId },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  if (!plan) {
    return NextResponse.json({ error: "尚未建立訓練計畫" }, { status: 404 });
  }
  return NextResponse.json(plan);
}

/** 建立訓練計畫（註解：若已存在則 409；請改用 PUT 全量取代）。 */
export async function POST(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({ where: { id: eventId, teamId: member.teamId } });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  try {
    assertTrainingEvent(event);
  } catch {
    return NextResponse.json({ error: "僅訓練事件可有訓練計畫" }, { status: 400 });
  }
  if (!canMutateTrainingPlan(member, event)) {
    return NextResponse.json({ error: "需要教練、管理員或隊務權限" }, { status: 403 });
  }

  let body: z.infer<typeof trainingPlanWriteSchema>;
  try {
    body = trainingPlanWriteSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const existing = await prisma.trainingPlan.findUnique({ where: { eventId } });
  if (existing) {
    return NextResponse.json({ error: "訓練計畫已存在，請使用 PUT 更新" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await createTrainingPlan(tx, {
      teamId: member.teamId,
      eventId,
      memberId: member.id,
      data: body,
    });
  });

  const plan = await prisma.trainingPlan.findUnique({
    where: { eventId },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(plan, { status: 201 });
}

/** 全量取代訓練計畫與段落（註解：不存在則建立）。 */
export async function PUT(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({ where: { id: eventId, teamId: member.teamId } });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  try {
    assertTrainingEvent(event);
  } catch {
    return NextResponse.json({ error: "僅訓練事件可有訓練計畫" }, { status: 400 });
  }
  if (!canMutateTrainingPlan(member, event)) {
    return NextResponse.json({ error: "需要教練、管理員或隊務權限" }, { status: 403 });
  }

  let body: z.infer<typeof trainingPlanWriteSchema>;
  try {
    body = trainingPlanWriteSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    await upsertTrainingPlanReplaceBlocks(tx, {
      teamId: member.teamId,
      eventId,
      memberId: member.id,
      data: body,
    });
  });

  const plan = await prisma.trainingPlan.findUnique({
    where: { eventId },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json(plan);
}

/** 刪除訓練計畫（註解：cascade 刪除 blocks）。 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({ where: { id: eventId, teamId: member.teamId } });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  try {
    assertTrainingEvent(event);
  } catch {
    return NextResponse.json({ error: "僅訓練事件可有訓練計畫" }, { status: 400 });
  }
  if (!canMutateTrainingPlan(member, event)) {
    return NextResponse.json({ error: "需要教練、管理員或隊務權限" }, { status: 403 });
  }

  await prisma.trainingPlan.deleteMany({ where: { eventId, teamId: member.teamId } });
  return NextResponse.json({ ok: true });
}
