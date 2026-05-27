import { TeamRole } from "@/generated/prisma/client";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { canManageTeamInOrg } from "@/lib/platform-rbac";
import { provisionTeamMember } from "@/lib/team-provisioning";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ orgId: string; teamId: string }> };

const postSchema = z.object({
  email: z.string().email(),
  role: z
    .enum([TeamRole.ADMIN, TeamRole.COACH, TeamRole.COACH_PLAYER, TeamRole.STAFF])
    .default(TeamRole.COACH),
  displayName: z.string().max(120).optional().nullable(),
  jerseyNumber: z.number().int().min(0).max(999).optional().nullable(),
});

/** 組織管理：依 Email 指派教練／管理員至球隊。 */
export async function POST(req: Request, { params }: Params) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { orgId, teamId } = await params;
  if (!(await canManageTeamInOrg(user.id, teamId))) {
    return NextResponse.json({ error: "需要組織管理權限" }, { status: 403 });
  }

  const prisma = getPrisma();
  const team = await prisma.team.findFirst({
    where: { id: teamId, organizationId: orgId },
  });
  if (!team) {
    return NextResponse.json({ error: "找不到球隊" }, { status: 404 });
  }

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const result = await provisionTeamMember({
    teamId,
    email: body.email,
    role: body.role,
    displayName: body.displayName,
    jerseyNumber: body.jerseyNumber,
    allowAdminRole: true,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, memberId: result.memberId },
      { status: result.status },
    );
  }

  await writePlatformAuditLog({
    actorUserId: user.id,
    action: "team.coach.add",
    targetType: "TeamMember",
    targetId: result.member.id,
    metadata: { teamId, email: body.email, role: body.role },
  });

  return NextResponse.json(result.member, { status: result.reactivated ? 200 : 201 });
}
