import { EventStatus, RsvpStatus } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  rsvpStatus: z.nativeEnum(RsvpStatus),
  rsvpReason: z.string().optional().nullable(),
});

/** 球員 RSVP（註解：僅能改自己的出席意願）。 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  if (body.rsvpStatus === RsvpStatus.UNANSWERED) {
    return NextResponse.json({ error: "不可設為 UNANSWERED" }, { status: 400 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  if (event.status !== EventStatus.PUBLISHED) {
    return NextResponse.json({ error: "事件尚未發布" }, { status: 403 });
  }

  const participant = await prisma.eventParticipant.findUnique({
    where: { eventId_memberId: { eventId, memberId: member.id } },
  });
  if (!participant) {
    return NextResponse.json({ error: "你不是此事件的參與者" }, { status: 403 });
  }

  const now = new Date();
  if (
    event.rsvpDeadlineAt != null &&
    now.getTime() > event.rsvpDeadlineAt.getTime()
  ) {
    return NextResponse.json({ error: "已超過 RSVP 截止時間" }, { status: 403 });
  }

  const row = await prisma.attendance.update({
    where: { eventId_memberId: { eventId, memberId: member.id } },
    data: {
      rsvpStatus: body.rsvpStatus,
      rsvpReason: body.rsvpReason ?? undefined,
      rsvpAt: new Date(),
    },
  });

  return NextResponse.json(row);
}
