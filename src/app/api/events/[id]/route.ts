import { EventStatus, EventType } from "@/generated/prisma/client";
import { syncEventParticipantsToMemberIds } from "@/lib/event-participant-sync";
import { getDebugTeamMember } from "@/lib/debug-session";
import { isMemberParticipantRuleFullyValid, resolveParticipantMemberIds } from "@/lib/participant-rule";
import type { ParticipantRule } from "@/lib/participant-rule-types";
import { participantRuleSchema } from "@/lib/participant-rule-schema";
import { notifyEventUpdated, shouldNotifyEventUpdated } from "@/lib/push/notify-events";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike, isStaff } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const patchBodySchema = z.object({
  title: z.string().min(1),
  type: z.nativeEnum(EventType),
  description: z.string().optional().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  meetAt: z.string().optional().nullable(),
  locationName: z.string().optional().nullable(),
  rsvpDeadlineAt: z.string().optional().nullable(),
  /** 若提供則重算參與者並同步 EventParticipant／Attendance（註解：移除者一併刪除 Feedback）。 */
  participantRule: participantRuleSchema.optional(),
});

/** 單一事件詳情（註解：含 participants / attendance；球員僅能看已發布且自己有參與）。 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id, teamId: member.teamId },
    include: {
      participants: { include: { member: { include: { user: true } } } },
      attendance: { include: { member: { include: { user: true } } } },
      trainingPlan: { include: { blocks: { orderBy: { order: "asc" } } } },
      feedback: true,
    },
  });

  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }

  if (isCoachLike(member) || isStaff(member)) {
    return NextResponse.json(event);
  }

  const isParticipant = event.participants.some((p) => p.memberId === member.id);
  if (!isParticipant) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }
  if (event.status !== EventStatus.PUBLISHED) {
    return NextResponse.json({ error: "事件尚未發布" }, { status: 403 });
  }

  return NextResponse.json(event);
}

/** 更新事件（註解：僅教練／管理員；已取消不可改；RSVP 截止須 ≤ 開始時間）。 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  if (!isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof patchBodySchema>;
  try {
    body = patchBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const existing = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
  });
  if (!existing) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  if (existing.status === EventStatus.CANCELLED) {
    return NextResponse.json({ error: "已取消的事件無法修改" }, { status: 400 });
  }

  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "時間格式無效" }, { status: 400 });
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    return NextResponse.json({ error: "結束時間須晚於開始時間" }, { status: 400 });
  }

  const meetAt =
    body.meetAt === undefined || body.meetAt === null || body.meetAt === "" ?
      null
    : new Date(body.meetAt);
  if (meetAt != null && Number.isNaN(meetAt.getTime())) {
    return NextResponse.json({ error: "集合時間格式無效" }, { status: 400 });
  }

  const rsvpDeadlineAt =
    body.rsvpDeadlineAt === undefined || body.rsvpDeadlineAt === null || body.rsvpDeadlineAt === "" ?
      null
    : new Date(body.rsvpDeadlineAt);
  if (rsvpDeadlineAt != null && Number.isNaN(rsvpDeadlineAt.getTime())) {
    return NextResponse.json({ error: "RSVP 截止時間格式無效" }, { status: 400 });
  }
  if (rsvpDeadlineAt != null && rsvpDeadlineAt.getTime() > startsAt.getTime()) {
    return NextResponse.json(
      { error: "RSVP 截止時間須早於或等於事件開始時間" },
      { status: 400 },
    );
  }

  let newMemberIds: string[] | null = null;
  if (body.participantRule !== undefined) {
    const rule = body.participantRule as ParticipantRule;
    if (rule.kind === "MEMBERS") {
      const ok = await isMemberParticipantRuleFullyValid(existing.teamId, rule);
      if (!ok) {
        return NextResponse.json(
          { error: "指名參與含有無效、停用或不在本隊的隊員" },
          { status: 400 },
        );
      }
    }
    newMemberIds = await resolveParticipantMemberIds(existing.teamId, rule);
    if (newMemberIds.length === 0) {
      return NextResponse.json(
        { error: rule.kind === "SQUADS" ? "所選分組目前沒有在籍隊員" : "參與者為空" },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.update({
      where: { id: eventId },
      data: {
        title: body.title,
        type: body.type,
        description: body.description ?? null,
        startsAt,
        endsAt,
        meetAt,
        locationName: body.locationName?.trim() || null,
        rsvpDeadlineAt,
      },
    });
    if (newMemberIds !== null) {
      await syncEventParticipantsToMemberIds(tx, eventId, newMemberIds);
    }
    return ev;
  });

  if (shouldNotifyEventUpdated(existing.status)) {
    notifyEventUpdated(existing.teamId, eventId, body.title);
  }

  return NextResponse.json(updated);
}
