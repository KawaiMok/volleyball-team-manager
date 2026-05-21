import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import {
  canManagePlayerReviews,
  isPlayerReviewSubjectRole,
  isPlayerReviewWindowOpen,
} from "@/lib/player-review-access";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string; memberId: string }> };

const bodySchema = z.object({
  content: z.string().max(4000),
});

/** 教練 upsert／刪除單一球員私評（註解：content 空白則刪除）。 */
export async function PUT(req: Request, ctx: Ctx) {
  const { id: eventId, memberId: targetMemberId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member || !canManagePlayerReviews(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
    select: { id: true, status: true, endsAt: true },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }

  if (!isPlayerReviewWindowOpen(event)) {
    return NextResponse.json({ error: "事件結束後才可撰寫評語" }, { status: 400 });
  }

  const participant = await prisma.eventParticipant.findUnique({
    where: { eventId_memberId: { eventId, memberId: targetMemberId } },
    include: { member: { select: { role: true } } },
  });
  if (!participant) {
    return NextResponse.json({ error: "此隊員不在本場參與名單" }, { status: 404 });
  }
  if (!isPlayerReviewSubjectRole(participant.member.role)) {
    return NextResponse.json({ error: "僅能對球員撰寫評語" }, { status: 400 });
  }

  const content = body.content.trim();
  if (!content) {
    await prisma.eventPlayerReview.deleteMany({
      where: { eventId, memberId: targetMemberId },
    });
    return NextResponse.json({ deleted: true });
  }

  const row = await prisma.eventPlayerReview.upsert({
    where: { eventId_memberId: { eventId, memberId: targetMemberId } },
    create: {
      eventId,
      memberId: targetMemberId,
      authorMemberId: member.id,
      content,
    },
    update: {
      content,
      authorMemberId: member.id,
    },
  });

  return NextResponse.json({
    id: row.id,
    memberId: row.memberId,
    content: row.content,
    updatedAt: row.updatedAt.toISOString(),
  });
}
