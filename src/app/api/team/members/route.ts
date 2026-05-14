import { MemberStatus, TeamRole } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike, isTeamAdmin } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

const postSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(TeamRole),
  jerseyNumber: z.number().int().min(0).max(999).optional().nullable(),
  squad: z.string().max(32).optional().nullable(),
  /** 預備顯示姓名：寫入 User.name（僅在尚無姓名時補上，不覆蓋既有 Clerk 姓名）（註解：方便名單先顯示暱稱）。 */
  displayName: z.string().max(120).optional().nullable(),
  position: z.string().max(64).optional().nullable(),
  phone: z.string().max(32).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

/** 隊員列表（註解：教練／管理員）。 */
export async function GET() {
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  if (!isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  const prisma = getPrisma();
  const rows = await prisma.teamMember.findMany({
    where: { teamId: member.teamId },
    include: {
      user: { select: { id: true, email: true, name: true, clerkUserId: true } },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json(rows);
}

/**
 * 依 Email 建立／連結使用者並加入目前隊伍（註解：正式環境取代 bootstrap；对方首次 Clerk 登入會合併）。
 */
export async function POST(req: Request) {
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  if (!isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const emailNorm = body.email.trim().toLowerCase();
  const displayTrim = body.displayName?.trim() || null;
  const positionTrim = body.position?.trim() || null;
  const phoneTrim = body.phone?.trim() || null;
  const notesTrim = body.notes?.trim() || null;

  const prisma = getPrisma();

  let user = await prisma.user.findUnique({
    where: { email: emailNorm },
  });
  if (!user) {
    user = await prisma.user.create({
      data: { email: emailNorm, name: displayTrim ?? undefined },
    });
  } else if (displayTrim && !(user.name && user.name.trim())) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name: displayTrim },
    });
  }

  const dup = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: member.teamId, userId: user.id } },
  });
  if (dup) {
    return NextResponse.json({ error: "此信箱對應的使用者已在隊伍中" }, { status: 409 });
  }

  if (body.role === TeamRole.ADMIN && !isTeamAdmin(member)) {
    return NextResponse.json({ error: "僅管理員可將新成員設為管理員" }, { status: 403 });
  }

  if (body.jerseyNumber != null) {
    const clash = await prisma.teamMember.findFirst({
      where: {
        teamId: member.teamId,
        jerseyNumber: body.jerseyNumber,
      },
    });
    if (clash) {
      return NextResponse.json({ error: "背號與既有隊員衝突" }, { status: 400 });
    }
  }

  const squadTrim = body.squad?.trim();

  const row = await prisma.teamMember.create({
    data: {
      teamId: member.teamId,
      userId: user.id,
      role: body.role,
      status: MemberStatus.ACTIVE,
      jerseyNumber: body.jerseyNumber ?? undefined,
      squad: squadTrim || undefined,
      position: positionTrim ?? undefined,
      phone: phoneTrim ?? undefined,
      notes: notesTrim ?? undefined,
    },
    include: {
      user: { select: { id: true, email: true, name: true, clerkUserId: true } },
    },
  });

  return NextResponse.json(row, { status: 201 });
}
