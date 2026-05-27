import { TeamLifecycleStatus, TeamRole } from "@/generated/prisma/client";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { canManageOrganization } from "@/lib/platform-rbac";
import { provisionTeamMember } from "@/lib/team-provisioning";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ orgId: string }> };

const coachSchema = z.object({
  email: z.string().email(),
  role: z
    .enum([TeamRole.ADMIN, TeamRole.COACH, TeamRole.COACH_PLAYER, TeamRole.STAFF])
    .default(TeamRole.ADMIN),
  displayName: z.string().max(120).optional().nullable(),
});

const createTeamSchema = z.object({
  name: z.string().min(1).max(120),
  season: z.string().max(32).optional().nullable(),
  timezone: z.string().max(64).optional(),
  groupConfig: z.array(z.string().max(32)).optional().nullable(),
  initialCoaches: z.array(coachSchema).optional(),
});

/** 組織管理：旗下球隊列表。 */
export async function GET(_req: Request, { params }: Params) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { orgId } = await params;
  if (!(await canManageOrganization(user.id, orgId))) {
    return NextResponse.json({ error: "需要組織管理權限" }, { status: 403 });
  }

  const prisma = getPrisma();
  const teams = await prisma.team.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { members: true, events: true } },
    },
  });

  return NextResponse.json(teams);
}

/** 組織管理：建立球隊並可選指派首位教練（註解：核心開通流程）。 */
export async function POST(req: Request, { params }: Params) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { orgId } = await params;
  if (!(await canManageOrganization(user.id, orgId))) {
    return NextResponse.json({ error: "需要組織管理權限" }, { status: 403 });
  }

  let body: z.infer<typeof createTeamSchema>;
  try {
    body = createTeamSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    return NextResponse.json({ error: "找不到組織" }, { status: 404 });
  }

  const team = await prisma.team.create({
    data: {
      organizationId: orgId,
      name: body.name.trim(),
      season: body.season?.trim() || undefined,
      timezone: body.timezone?.trim() || "Asia/Taipei",
      groupConfig: body.groupConfig ?? undefined,
      lifecycleStatus: TeamLifecycleStatus.ACTIVE,
    },
  });

  const coaches: unknown[] = [];
  for (const c of body.initialCoaches ?? []) {
    const result = await provisionTeamMember({
      teamId: team.id,
      email: c.email,
      role: c.role,
      displayName: c.displayName,
      allowAdminRole: true,
    });
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, teamId: team.id, partial: true },
        { status: result.status },
      );
    }
    coaches.push(result.member);
  }

  await writePlatformAuditLog({
    actorUserId: user.id,
    action: "team.create",
    targetType: "Team",
    targetId: team.id,
    metadata: { organizationId: orgId, name: team.name, coachCount: coaches.length },
  });

  return NextResponse.json({ ...team, coaches }, { status: 201 });
}
