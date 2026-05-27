import { OrganizationStatus } from "@/generated/prisma/client";
import { isValidOrgSlug, normalizeOrgSlug, writePlatformAuditLog } from "@/lib/platform-audit";
import { isCurrentUserPlatformAdmin } from "@/lib/platform-rbac";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().min(2).max(48),
  contactEmail: z.string().email().optional().nullable(),
});

/** 平台超管：組織列表。 */
export async function GET(req: Request) {
  if (!(await isCurrentUserPlatformAdmin())) {
    return NextResponse.json({ error: "需要平台管理員權限" }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";

  const prisma = getPrisma();
  const rows = await prisma.organization.findMany({
    where: q ?
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { slug: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { teams: true, members: true } },
    },
  });

  return NextResponse.json(rows);
}

/** 平台超管：建立組織。 */
export async function POST(req: Request) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user || !(await isCurrentUserPlatformAdmin())) {
    return NextResponse.json({ error: "需要平台管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof createSchema>;
  try {
    body = createSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const slug = normalizeOrgSlug(body.slug);
  if (!isValidOrgSlug(slug)) {
    return NextResponse.json(
      { error: "slug 須為 2–48 字小寫英數，可用連字號分隔" },
      { status: 400 },
    );
  }

  const prisma = getPrisma();
  const clash = await prisma.organization.findUnique({ where: { slug } });
  if (clash) {
    return NextResponse.json({ error: "此 slug 已被使用" }, { status: 409 });
  }

  const org = await prisma.organization.create({
    data: {
      name: body.name.trim(),
      slug,
      contactEmail: body.contactEmail?.trim().toLowerCase() ?? undefined,
      status: OrganizationStatus.ACTIVE,
    },
  });

  await writePlatformAuditLog({
    actorUserId: user.id,
    action: "org.create",
    targetType: "Organization",
    targetId: org.id,
    metadata: { name: org.name, slug: org.slug },
  });

  return NextResponse.json(org, { status: 201 });
}
