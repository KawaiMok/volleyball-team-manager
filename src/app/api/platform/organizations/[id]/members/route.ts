import { OrganizationRole } from "@/generated/prisma/client";
import { writePlatformAuditLog } from "@/lib/platform-audit";
import { isCurrentUserPlatformAdmin } from "@/lib/platform-rbac";
import { findOrCreateOrgMember } from "@/lib/team-provisioning";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const postSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(OrganizationRole).default(OrganizationRole.ORG_ADMIN),
  displayName: z.string().max(120).optional().nullable(),
});

/** 平台超管：指派組織成員（預設 ORG_ADMIN）。 */
export async function POST(req: Request, { params }: Params) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user || !(await isCurrentUserPlatformAdmin())) {
    return NextResponse.json({ error: "需要平台管理員權限" }, { status: 403 });
  }

  const { id: organizationId } = await params;
  const prisma = getPrisma();
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    return NextResponse.json({ error: "找不到組織" }, { status: 404 });
  }

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const row = await findOrCreateOrgMember({
    organizationId,
    email: body.email,
    role: body.role,
    displayName: body.displayName,
  });

  await writePlatformAuditLog({
    actorUserId: user.id,
    action: "org.member.add",
    targetType: "OrganizationMember",
    targetId: row.id,
    metadata: { organizationId, email: body.email, role: body.role },
  });

  return NextResponse.json(row, { status: 201 });
}
