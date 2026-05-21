import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import {
  canManagePlayerReviews,
  canReadOwnPlayerReview,
  isPlayerReviewSubjectRole,
  isPlayerReviewWindowOpen,
} from "@/lib/player-review-access";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

/** 列出場次私評：教練看全員；球員僅看自己的（註解：未寫則球員端為空）。 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
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
    return NextResponse.json({ error: "事件結束後才可查看評語" }, { status: 403 });
  }

  if (canManagePlayerReviews(member)) {
    const participants = await prisma.eventParticipant.findMany({
      where: { eventId },
      include: {
        member: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    const playerParticipants = participants.filter((p) => isPlayerReviewSubjectRole(p.member.role));
    const reviews = await prisma.eventPlayerReview.findMany({
      where: { eventId },
      include: {
        author: { include: { user: { select: { name: true, email: true } } } },
      },
    });
    const reviewByMember = new Map(reviews.map((r) => [r.memberId, r]));

    return NextResponse.json({
      items: playerParticipants.map((p) => {
        const review = reviewByMember.get(p.memberId);
        return {
          memberId: p.memberId,
          displayName: p.member.user?.name ?? p.member.user?.email ?? p.memberId.slice(0, 8),
          review:
            review ?
              {
                id: review.id,
                content: review.content,
                authorMemberId: review.authorMemberId,
                authorName:
                  review.author.user?.name?.trim() ||
                  review.author.user?.email?.trim() ||
                  "教練",
                updatedAt: review.updatedAt.toISOString(),
              }
            : null,
        };
      }),
    });
  }

  if (!canReadOwnPlayerReview(member)) {
    return NextResponse.json({ error: "無權限" }, { status: 403 });
  }

  const participant = await prisma.eventParticipant.findUnique({
    where: { eventId_memberId: { eventId, memberId: member.id } },
  });
  if (!participant) {
    return NextResponse.json({ error: "你不是此事件的參與者" }, { status: 403 });
  }

  const review = await prisma.eventPlayerReview.findUnique({
    where: { eventId_memberId: { eventId, memberId: member.id } },
    include: {
      author: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  if (!review) {
    return NextResponse.json({ review: null });
  }

  return NextResponse.json({
    review: {
      id: review.id,
      content: review.content,
      authorName:
        review.author.user?.name?.trim() || review.author.user?.email?.trim() || "教練",
      updatedAt: review.updatedAt.toISOString(),
    },
  });
}
