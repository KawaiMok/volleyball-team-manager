import { OrganizationStatus } from "@/generated/prisma/client";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { isCurrentUserPlatformAdmin } from "@/lib/platform-rbac";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  contactEmail: z.string().email().optional().nullable(),
  status: z.nativeEnum(OrganizationStatus).optional(),
});

/** 平台超管：組織詳情。 */
export async function GET(_req: Request, { params }: Params) {
  if (!(await isCurrentUserPlatformAdmin())) {
    return NextResponse.json({ error: "需要平台管理員權限" }, { status: 403 });
  }

  const { id } = await params;
  const prisma = getPrisma();
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, email: true, name: true, clerkUserId: true } } },
        orderBy: { createdAt: "asc" },
      },
      teams: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          season: true,
          lifecycleStatus: true,
          createdAt: true,
          _count: { select: { members: true } },
        },
      },
      _count: { select: { teams: true, members: true } },
    },
  });

  if (!org) {
    return NextResponse.json({ error: "找不到組織" }, { status: 404 });
  }

  return NextResponse.json(org);
}

/** 平台超管：更新組織（含停用）。 */
export async function PATCH(req: Request, { params }: Params) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user || !(await isCurrentUserPlatformAdmin())) {
    return NextResponse.json({ error: "需要平台管理員權限" }, { status: 403 });
  }

  const { id } = await params;
  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const existing = await prisma.organization.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "找不到組織" }, { status: 404 });
  }

  const org = await prisma.organization.update({
    where: { id },
    data: {
      name: body.name?.trim(),
      contactEmail: body.contactEmail === null ? null : body.contactEmail?.trim().toLowerCase(),
      status: body.status,
    },
  });

  await writePlatformAuditLog({
    actorUserId: user.id,
    action: "org.update",
    targetType: "Organization",
    targetId: org.id,
    metadata: body,
  });

  return NextResponse.json(org);
}
