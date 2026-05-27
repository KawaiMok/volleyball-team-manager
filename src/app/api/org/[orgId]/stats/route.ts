import { canManageOrganization } from "@/lib/platform-rbac";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ orgId: string }> };

/** 組織管理：儀表板統計。 */
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
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [teamCount, memberCount, eventCountRecent, teams] = await Promise.all([
    prisma.team.count({ where: { organizationId: orgId } }),
    prisma.organizationMember.count({
      where: { organizationId: orgId, status: "ACTIVE" },
    }),
    prisma.event.count({
      where: {
        team: { organizationId: orgId },
        startsAt: { gte: since },
      },
    }),
    prisma.team.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, season: true, lifecycleStatus: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({
    teamCount,
    orgMemberCount: memberCount,
    eventCountRecent,
    recentTeams: teams,
  });
}
