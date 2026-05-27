import { MemberStatus, TeamRole } from "@/generated/prisma/client";
import { isBootstrapAccessEnabled } from "@/lib/bootstrap-access";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const DEMO_TEAM_NAME = "示範排球隊";

const bodySchema = z.object({
  /** 教練兼球員：COACH_PLAYER（註解：單一隊籍雙身份）。 */
  role: z.enum(["COACH", "PLAYER", "COACH_PLAYER"]).default("PLAYER"),
});

/**
 * 開發：目前 Clerk 使用者加入示範隊伍（註解：需 ALLOW_BOOTSTRAP=1；正式環境請用隊務邀請）。
 */
export async function POST(req: Request) {
  if (!isBootstrapAccessEnabled()) {
    return NextResponse.json({ error: "Bootstrap 未開放（正式環境已關閉）" }, { status: 403 });
  }

  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();

  const existingMembership = await prisma.teamMember.findFirst({
    where: { userId: user.id, status: MemberStatus.ACTIVE },
  });
  if (existingMembership) {
    const path =
      existingMembership.role === TeamRole.PLAYER ? "/player" : "/coach"; // 註解：COACH_PLAYER 等非純 PLAYER 導向教練端為預設入口
    return NextResponse.json({
      ok: true,
      alreadyMember: true,
      teamId: existingMembership.teamId,
      role: existingMembership.role,
      redirectTo: path,
    });
  }

  let team = await prisma.team.findFirst({
    where: { name: DEMO_TEAM_NAME },
    orderBy: { createdAt: "asc" },
  });
  if (!team) {
    const defaultOrg = await prisma.organization.findUnique({ where: { slug: "aaaism" } });
    if (!defaultOrg) {
      return NextResponse.json({ error: "找不到預設組織" }, { status: 500 });
    }
    team = await prisma.team.create({
      data: {
        organizationId: defaultOrg.id,
        name: DEMO_TEAM_NAME,
        season: String(new Date().getFullYear()),
        groupConfig: ["A", "B"],
      },
    });
  }

  const roleEnum: TeamRole =
    body.role === "COACH" ? TeamRole.COACH
    : body.role === "COACH_PLAYER" ? TeamRole.COACH_PLAYER
    : TeamRole.PLAYER;

  const member = await prisma.teamMember.upsert({
    where: {
      teamId_userId: { teamId: team.id, userId: user.id },
    },
    create: {
      teamId: team.id,
      userId: user.id,
      role: roleEnum,
      status: MemberStatus.ACTIVE,
      /** 避免與既有背號衝突（註解：示範隊可為 null）。 */
      jerseyNumber: null,
      squad: "A",
    },
    update: {
      role: roleEnum,
      status: MemberStatus.ACTIVE,
    },
  });

  const redirectTo = member.role === TeamRole.PLAYER ? "/player" : "/coach";

  return NextResponse.json({
    ok: true,
    alreadyMember: false,
    teamId: team.id,
    role: member.role,
    redirectTo,
  });
}
