import { OrganizationRole } from "@/generated/prisma/client";
import { canManageOrganization } from "@/lib/platform-rbac";
import { findOrCreateOrgMember } from "@/lib/team-provisioning";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ orgId: string }> };

const postSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(OrganizationRole).default(OrganizationRole.ORG_ADMIN),
  displayName: z.string().max(120).optional().nullable(),
});

/** 組織管理：成員列表。 */
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
  const rows = await prisma.organizationMember.findMany({
    where: { organizationId: orgId, status: "ACTIVE" },
    include: { user: { select: { id: true, email: true, name: true, clerkUserId: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(rows);
}

/** 組織管理：新增組織管理員（ORG_ADMIN 可用）。 */
export async function POST(req: Request, { params }: Params) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const { orgId } = await params;
  if (!(await canManageOrganization(user.id, orgId))) {
    return NextResponse.json({ error: "需要組織管理權限" }, { status: 403 });
  }

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const row = await findOrCreateOrgMember({
    organizationId: orgId,
    email: body.email,
    role: body.role,
    displayName: body.displayName,
  });

  await writePlatformAuditLog({
    actorUserId: user.id,
    action: "org.member.add",
    targetType: "OrganizationMember",
    targetId: row.id,
    metadata: { organizationId: orgId, email: body.email },
  });

  return NextResponse.json(row, { status: 201 });
}
