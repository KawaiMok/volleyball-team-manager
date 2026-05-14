import { getDebugTeamMember } from "@/lib/debug-session";
import { canManageEventCommentsAsStaff } from "@/lib/event-comment-access";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string; commentId: string }> };

const patchSchema = z.object({
  content: z.string().min(1).max(8000).trim(),
});

/** 更新留言內容（註解：作者本人或教練／隊務可編輯）。 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id: eventId, commentId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const existing = await prisma.comment.findFirst({
    where: { id: commentId, eventId, teamId: member.teamId },
  });
  if (!existing) {
    return NextResponse.json({ error: "找不到留言" }, { status: 404 });
  }

  const isAuthor = existing.authorMemberId === member.id;
  if (!isAuthor && !canManageEventCommentsAsStaff(member)) {
    return NextResponse.json({ error: "僅作者或教練／隊務可編輯" }, { status: 403 });
  }

  const row = await prisma.comment.update({
    where: { id: commentId },
    data: { content: body.content },
    include: { author: { include: { user: { select: { name: true, email: true } } } } },
  });

  return NextResponse.json({
    id: row.id,
    eventId: row.eventId,
    teamId: row.teamId,
    type: row.type,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    authorMemberId: row.authorMemberId,
    authorName: row.author.user?.name?.trim() || row.author.user?.email || "成員",
  });
}

/** 刪除留言（註解：作者本人或教練／隊務可刪除）。 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id: eventId, commentId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const existing = await prisma.comment.findFirst({
    where: { id: commentId, eventId, teamId: member.teamId },
  });
  if (!existing) {
    return NextResponse.json({ error: "找不到留言" }, { status: 404 });
  }

  const isAuthor = existing.authorMemberId === member.id;
  if (!isAuthor && !canManageEventCommentsAsStaff(member)) {
    return NextResponse.json({ error: "僅作者或教練／隊務可刪除" }, { status: 403 });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
