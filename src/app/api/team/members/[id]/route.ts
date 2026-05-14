import { MemberStatus, TeamRole } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike, isTeamAdmin } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  role: z.nativeEnum(TeamRole),
  status: z.nativeEnum(MemberStatus),
  jerseyNumber: z.union([z.number().int().min(0).max(999), z.null()]),
  squad: z.union([z.string().max(32), z.null()]),
  position: z.union([z.string().max(64), z.null()]),
  phone: z.union([z.string().max(32), z.null()]),
  notes: z.union([z.string().max(2000), z.null()]),
  /** 顯示姓名：同步寫入 User.name（註解：空字串則清空）。 */
  displayName: z.string().max(120),
});

/** 更新隊員／隊務隊籍（註解：教練／管理員；不可停用自己）。 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id: targetMemberId } = await ctx.params;
  const actor = await getDebugTeamMember();
  if (!actor) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  if (!isCoachLike(actor)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const target = await prisma.teamMember.findFirst({
    where: { id: targetMemberId, teamId: actor.teamId },
    include: { user: { select: { id: true } } },
  });

  if (!target) {
    return NextResponse.json({ error: "找不到隊員" }, { status: 404 });
  }

  if (body.role === TeamRole.ADMIN && !isTeamAdmin(actor)) {
    return NextResponse.json({ error: "僅管理員可指派管理員角色" }, { status: 403 });
  }
  if (!isTeamAdmin(actor)) {
    if (target.role === TeamRole.ADMIN && body.role !== TeamRole.ADMIN) {
      return NextResponse.json({ error: "僅管理員可調整管理員角色" }, { status: 403 });
    }
  }
  if (target.role === TeamRole.ADMIN && body.role !== TeamRole.ADMIN) {
    const adminCount = await prisma.teamMember.count({
      where: { teamId: actor.teamId, role: TeamRole.ADMIN, status: MemberStatus.ACTIVE },
    });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "隊伍須至少保留一位在籍管理員" }, { status: 400 });
    }
  }

  if (body.status === MemberStatus.INACTIVE && target.id === actor.id) {
    return NextResponse.json({ error: "不可將自己的隊籍設為停用" }, { status: 400 });
  }

  const squadTrim = body.squad === null ? null : body.squad.trim() || null;
  const positionTrim = body.position === null ? null : body.position.trim() || null;
  const phoneTrim = body.phone === null ? null : body.phone.trim() || null;
  const notesTrim = body.notes === null ? null : body.notes.trim() || null;
  const displayTrim = body.displayName.trim();

  if (body.jerseyNumber != null) {
    const clash = await prisma.teamMember.findFirst({
      where: {
        teamId: actor.teamId,
        jerseyNumber: body.jerseyNumber,
        NOT: { id: targetMemberId },
      },
    });
    if (clash) {
      return NextResponse.json({ error: "背號與其他隊員衝突" }, { status: 400 });
    }
  }

  const [updatedMember] = await prisma.$transaction([
    prisma.teamMember.update({
      where: { id: targetMemberId },
      data: {
        role: body.role,
        status: body.status,
        jerseyNumber: body.jerseyNumber,
        squad: squadTrim,
        position: positionTrim,
        phone: phoneTrim,
        notes: notesTrim,
      },
      include: {
        user: { select: { id: true, email: true, name: true, clerkUserId: true } },
      },
    }),
    prisma.user.update({
      where: { id: target.userId },
      data: { name: displayTrim === "" ? null : displayTrim },
    }),
  ]);

  return NextResponse.json(updatedMember);
}
