import { EventStatus, RsvpStatus } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { notifyRsvpReminder } from "@/lib/push/notify-events";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z
  .object({
    /** 指定隊員（註解：省略則推播給所有未回覆者）。 */
    memberId: z.string().optional(),
  })
  .optional();

/** 教練催回覆 RSVP：推播給尚未回覆的參與球員（註解：僅已發布事件）。 */
export async function POST(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member || !isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    const raw = await req.json().catch(() => undefined);
    body = bodySchema.parse(raw);
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
    select: { id: true, title: true, status: true, teamId: true },
  });

  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }

  if (event.status !== EventStatus.PUBLISHED) {
    return NextResponse.json({ error: "僅已發布的事件可催回覆出席意願" }, { status: 400 });
  }

  const targetMemberId = body?.memberId?.trim();

  if (targetMemberId) {
    const attendance = await prisma.attendance.findUnique({
      where: { eventId_memberId: { eventId, memberId: targetMemberId } },
      select: {
        rsvpStatus: true,
        member: { select: { userId: true, user: { select: { name: true, email: true } } } },
      },
    });

    if (!attendance) {
      return NextResponse.json({ error: "找不到此隊員的出席紀錄" }, { status: 404 });
    }

    if (attendance.rsvpStatus !== RsvpStatus.UNANSWERED) {
      return NextResponse.json({ error: "此隊員已回覆出席意願，無需催回覆" }, { status: 400 });
    }

    notifyRsvpReminder({
      teamId: event.teamId,
      eventId: event.id,
      eventTitle: event.title,
      userIds: [attendance.member.userId],
    });

    const displayName =
      attendance.member.user.name?.trim() ||
      attendance.member.user.email?.trim() ||
      targetMemberId.slice(0, 8);

    return NextResponse.json({ reminded: 1, memberId: targetMemberId, displayName });
  }

  const unanswered = await prisma.attendance.findMany({
    where: { eventId, rsvpStatus: RsvpStatus.UNANSWERED },
    select: { member: { select: { userId: true } } },
  });

  const userIds = [...new Set(unanswered.map((a) => a.member.userId))];
  if (userIds.length === 0) {
    return NextResponse.json({ reminded: 0, message: "所有參與者皆已回覆" });
  }

  notifyRsvpReminder({
    teamId: event.teamId,
    eventId: event.id,
    eventTitle: event.title,
    userIds,
  });

  return NextResponse.json({ reminded: userIds.length });
}
