import { auth, currentUser } from "@clerk/nextjs/server";
import { cache } from "react";

import {
  MemberStatus,
  OrganizationRole,
  OrganizationStatus,
  type OrganizationMember,
  type User,
} from "@/generated/prisma/client";
import { isEmailInPlatformAdminEnv } from "@/lib/platform-admin-access";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";

/** 是否為平台超管（註解：PlatformAdmin 表、Prisma email 或 Clerk email 白名單）。 */
export async function isPlatformAdminForUser(user: User): Promise<boolean> {
  const prisma = getPrisma();
  const row = await prisma.platformAdmin.findUnique({ where: { userId: user.id } });
  if (row) return true;
  if (isEmailInPlatformAdminEnv(user.email)) return true;

  /** Clerk 主要 Email 與 Prisma 尚未同步時仍可比對白名單（註解：首次登入常見）。 */
  const cu = await getCachedClerkUser();
  const clerkEmail =
    cu?.primaryEmailAddress?.emailAddress ?? cu?.emailAddresses?.[0]?.emailAddress;
  return isEmailInPlatformAdminEnv(clerkEmail);
}

const getCachedClerkUser = cache(async () => currentUser());

/** 目前請求使用者是否為平台超管。 */
export async function isCurrentUserPlatformAdmin(): Promise<boolean> {
  const user = await getOrSyncPrismaUserFromClerk();
  if (user && (await isPlatformAdminForUser(user))) return true;

  /** 尚未寫入 Prisma User 時，直接比對 Clerk session email（註解：極少數 edge case）。 */
  const { userId } = await auth();
  if (!userId) return false;
  const cu = await getCachedClerkUser();
  const clerkEmail =
    cu?.primaryEmailAddress?.emailAddress ?? cu?.emailAddresses?.[0]?.emailAddress;
  return isEmailInPlatformAdminEnv(clerkEmail);
}

/** 取得使用者在指定組織的 ACTIVE 成員紀錄。 */
export async function getOrgMembership(
  userId: string,
  organizationId: string,
): Promise<OrganizationMember | null> {
  return getPrisma().organizationMember.findFirst({
    where: {
      userId,
      organizationId,
      status: MemberStatus.ACTIVE,
    },
  });
}

/** 是否為組織管理員（ORG_ADMIN）。 */
export function isOrgAdmin(member: OrganizationMember | null): boolean {
  return member?.role === OrganizationRole.ORG_ADMIN;
}

/** 平台超管或組織 ORG_ADMIN 可管理組織（註解：ORG_STAFF 僅讀，Phase 2 擴充）。 */
export async function canManageOrganization(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return false;
  if (await isPlatformAdminForUser(user)) return true;

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org || org.status !== OrganizationStatus.ACTIVE) return false;

  const membership = await getOrgMembership(userId, organizationId);
  return isOrgAdmin(membership);
}

/** 平台超管或組織管理員可管理該球隊（註解：向上查 team.organizationId）。 */
export async function canManageTeamInOrg(userId: string, teamId: string): Promise<boolean> {
  const prisma = getPrisma();
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { organizationId: true },
  });
  if (!team) return false;
  return canManageOrganization(userId, team.organizationId);
}

/** 列出使用者可管理的 ACTIVE 組織（註解：首頁入口、org layout）。 */
export async function listManageableOrganizationsForUser(userId: string) {
  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return [];

  if (await isPlatformAdminForUser(user)) {
    return prisma.organization.findMany({
      where: { status: OrganizationStatus.ACTIVE },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    });
  }

  const rows = await prisma.organizationMember.findMany({
    where: {
      userId,
      status: MemberStatus.ACTIVE,
      role: OrganizationRole.ORG_ADMIN,
      organization: { status: OrganizationStatus.ACTIVE },
    },
    include: { organization: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "asc" },
  });

  return rows.map((r) => r.organization);
}

/** 依 slug 解析組織（註解：404 由呼叫端處理）。 */
export async function getOrganizationBySlug(slug: string) {
  return getPrisma().organization.findUnique({ where: { slug } });
}
