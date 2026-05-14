import { CommentType, EventStatus } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import {
  canManageEventCommentsAsStaff,
  canReadEventCommentsAsCoachSide,
  canReadEventCommentsAsPlayer,
} from "@/lib/event-comment-access";
import { getPrisma } from "@/lib/prisma";
import { isPlayer } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const postSchema = z.object({
  type: z.nativeEnum(CommentType),
  content: z.string().min(1).max(8000).trim(),
});

const commentInclude = {
  author: { include: { user: { select: { name: true, email: true } } } },
} as const;

function serializeComment(
  c: {
    id: string;
    teamId: string;
    eventId: string;
    authorMemberId: string;
    type: CommentType;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    author: { user: { name: string | null; email: string | null } };
  },
) {
  return {
    id: c.id,
    eventId: c.eventId,
    teamId: c.teamId,
    type: c.type,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    authorMemberId: c.authorMemberId,
    authorName: c.author.user?.name?.trim() || c.author.user?.email || "成員",
  };
}

/** 取得事件留言／公告列表（註解：教練端含草稿；球員端僅已發布之參與者）。 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
    select: { id: true, status: true },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }

  let allowed = false;
  if (canReadEventCommentsAsCoachSide(member)) {
    allowed = true;
  } else if (isPlayer(member)) {
    const participant = await prisma.eventParticipant.findUnique({
      where: { eventId_memberId: { eventId, memberId: member.id } },
    });
    allowed = canReadEventCommentsAsPlayer(member, event, Boolean(participant));
  }

  if (!allowed) {
    return NextResponse.json({ error: "無權限瀏覽此區" }, { status: 403 });
  }

  const rows = await prisma.comment.findMany({
    where: { eventId },
    include: commentInclude,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(rows.map(serializeComment));
}

/** 新增公告或留言（註解：教練／隊務可發公告或留言；球員僅可發留言且須已發布事件之參與者）。 */
export async function POST(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
    select: { id: true, status: true },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }

  if (canManageEventCommentsAsStaff(member)) {
    // staff ok
  } else if (isPlayer(member)) {
    if (body.type !== CommentType.COMMENT) {
      return NextResponse.json({ error: "僅教練／隊務可發布公告" }, { status: 403 });
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
  } else {
    return NextResponse.json({ error: "無權限發言" }, { status: 403 });
  }

  const row = await prisma.comment.create({
    data: {
      teamId: member.teamId,
      eventId,
      authorMemberId: member.id,
      type: body.type,
      content: body.content,
    },
    include: commentInclude,
  });

  return NextResponse.json(serializeComment(row), { status: 201 });
}
