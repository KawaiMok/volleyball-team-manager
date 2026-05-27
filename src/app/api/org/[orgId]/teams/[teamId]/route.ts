import { TeamLifecycleStatus } from "@/generated/prisma/client";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { canManageTeamInOrg } from "@/lib/platform-rbac";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ orgId: string; teamId: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  season: z.string().max(32).optional().nullable(),
  timezone: z.string().max(64).optional(),
  lifecycleStatus: z.nativeEnum(TeamLifecycleStatus).optional(),
});

/** 組織管理：單一球隊詳情。 */
export async function GET(_req: Request, { params }: Params) {
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
    include: {
      members: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, email: true, name: true, clerkUserId: true } } },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      },
      _count: { select: { members: true, events: true } },
    },
  });

  if (!team) {
    return NextResponse.json({ error: "找不到球隊" }, { status: 404 });
  }

  return NextResponse.json(team);
}

/** 組織管理：更新球隊或封存。 */
export async function PATCH(req: Request, { params }: Params) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { orgId, teamId } = await params;
  if (!(await canManageTeamInOrg(user.id, teamId))) {
    return NextResponse.json({ error: "需要組織管理權限" }, { status: 403 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const existing = await prisma.team.findFirst({
    where: { id: teamId, organizationId: orgId },
  });
  if (!existing) {
    return NextResponse.json({ error: "找不到球隊" }, { status: 404 });
  }

  const team = await prisma.team.update({
    where: { id: teamId },
    data: {
      name: body.name?.trim(),
      season: body.season === null ? null : body.season?.trim(),
      timezone: body.timezone?.trim(),
      lifecycleStatus: body.lifecycleStatus,
    },
  });

  await writePlatformAuditLog({
    actorUserId: user.id,
    action: "team.update",
    targetType: "Team",
    targetId: team.id,
    metadata: body,
  });

  return NextResponse.json(team);
}
