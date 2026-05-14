import { EventStatus, EventType } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isMemberParticipantRuleFullyValid, resolveParticipantMemberIds } from "@/lib/participant-rule";
import type { ParticipantRule } from "@/lib/participant-rule-types";
import { participantRuleSchema } from "@/lib/participant-rule-schema";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

const createBodySchema = z.object({
  teamId: z.string().min(1),
  type: z.nativeEnum(EventType),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  meetAt: z.string().optional().nullable(),
  locationName: z.string().optional().nullable(),
  rsvpDeadlineAt: z.string().optional().nullable(),
  participantRule: participantRuleSchema,
});

/** 列出隊伍事件（註解：教練看全部；球員只看已發布且自己有參與）。 */
export async function GET(req: Request) {
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const url = new URL(req.url);
  const teamId = url.searchParams.get("teamId");
  if (!teamId || teamId !== member.teamId) {
    return NextResponse.json({ error: "teamId 無效" }, { status: 400 });
  }

  const prisma = getPrisma();
  if (isCoachLike(member)) {
    const events = await prisma.event.findMany({
      where: { teamId },
      orderBy: { startsAt: "asc" },
      include: {
        _count: { select: { participants: true, attendance: true } },
      },
    });
    return NextResponse.json(events);
  }

  const events = await prisma.event.findMany({
    where: {
      teamId,
      status: EventStatus.PUBLISHED,
      participants: { some: { memberId: member.id } },
    },
    orderBy: { startsAt: "asc" },
    include: {
      attendance: {
        where: { memberId: member.id },
        take: 1,
      },
    },
  });
  return NextResponse.json(events);
}

/** 建立草稿事件並展開參與者＋Attendance（註解：僅教練/隊務）。 */
export async function POST(req: Request) {
  const member = await getDebugTeamMember();
  if (!member || !isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof createBodySchema>;
  try {
    body = createBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  if (body.teamId !== member.teamId) {
    return NextResponse.json({ error: "不可操作其他隊伍" }, { status: 403 });
  }

  const startsAt = new Date(body.startsAt);
  const endsAt = new Date(body.endsAt);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "時間格式無效" }, { status: 400 });
  }

  const participantRule = body.participantRule as ParticipantRule;
  if (participantRule.kind === "MEMBERS") {
    const ok = await isMemberParticipantRuleFullyValid(body.teamId, participantRule);
    if (!ok) {
      return NextResponse.json(
        { error: "指名參與含有無效、停用或不在本隊的隊員" },
        { status: 400 },
      );
    }
  }
  const memberIds = await resolveParticipantMemberIds(body.teamId, participantRule);
  if (memberIds.length === 0) {
    return NextResponse.json(
      { error: participantRule.kind === "SQUADS" ? "所選分組目前沒有在籍隊員" : "參與者為空" },
      { status: 400 },
    );
  }

  const rsvpDeadlineAt = body.rsvpDeadlineAt ? new Date(body.rsvpDeadlineAt) : null;
  if (rsvpDeadlineAt != null && Number.isNaN(rsvpDeadlineAt.getTime())) {
    return NextResponse.json({ error: "RSVP 截止時間格式無效" }, { status: 400 });
  }
  if (
    rsvpDeadlineAt != null &&
    !Number.isNaN(rsvpDeadlineAt.getTime()) &&
    rsvpDeadlineAt.getTime() > startsAt.getTime()
  ) {
    return NextResponse.json(
      { error: "RSVP 截止時間須早於或等於事件開始時間" },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const event = await prisma.$transaction(async (tx) => {
    const ev = await tx.event.create({
      data: {
        teamId: body.teamId,
        type: body.type,
        title: body.title,
        description: body.description ?? undefined,
        startsAt,
        endsAt,
        meetAt: body.meetAt ? new Date(body.meetAt) : undefined,
        locationName: body.locationName ?? undefined,
        status: EventStatus.DRAFT,
        rsvpDeadlineAt: rsvpDeadlineAt ?? undefined,
        createdByMemberId: member.id,
      },
    });

    await tx.eventParticipant.createMany({
      data: memberIds.map((mid) => ({ eventId: ev.id, memberId: mid })),
      skipDuplicates: true,
    });

    await tx.attendance.createMany({
      data: memberIds.map((mid) => ({ eventId: ev.id, memberId: mid })),
      skipDuplicates: true,
    });

    return ev;
  });

  return NextResponse.json(event, { status: 201 });
}
