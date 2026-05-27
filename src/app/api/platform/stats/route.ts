import { isCurrentUserPlatformAdmin } from "@/lib/platform-rbac";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** 平台超管：總覽統計。 */
export async function GET() {
  if (!(await isCurrentUserPlatformAdmin())) {
    return NextResponse.json({ error: "需要平台管理員權限" }, { status: 403 });
  }

  const prisma = getPrisma();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [organizationCount, teamCount, userCount, recentOrgs, recentTeams] = await Promise.all([
    prisma.organization.count(),
    prisma.team.count(),
    prisma.user.count(),
    prisma.organization.count({ where: { createdAt: { gte: since } } }),
    prisma.team.count({ where: { createdAt: { gte: since } } }),
  ]);

  return NextResponse.json({
    organizationCount,
    teamCount,
    userCount,
    recentOrgs,
    recentTeams,
  });
}
