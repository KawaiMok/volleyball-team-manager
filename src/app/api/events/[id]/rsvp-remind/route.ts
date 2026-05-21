import { EventStatus, RsvpStatus } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { notifyRsvpReminder } from "@/lib/push/notify-events";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

/** 教練催回覆 RSVP：推播給尚未回覆的參與球員（註解：僅已發布事件）。 */
export async function POST(_req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member || !isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
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
    return NextResponse.json({ error: "僅已發布的事件可催回覆 RSVP" }, { status: 400 });
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
