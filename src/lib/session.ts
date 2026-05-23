import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { cache } from "react";

import type { TeamMember, User } from "@/generated/prisma/client";
import { MemberStatus } from "@/generated/prisma/client";
import { isDebugAuthEnabled } from "@/lib/debug-auth-access";
import { getPrisma } from "@/lib/prisma";

/** 目前作用中隊伍（註解：多隊時由 UI 寫入，供 getTeamMember 讀取）。 */
export const ACTIVE_TEAM_COOKIE_NAME = "active-team-id";
const ACTIVE_TEAM_COOKIE = ACTIVE_TEAM_COOKIE_NAME;

/** 同一請求內 Clerk auth 去重（註解：layout + page 共用）。 */
const getCachedClerkAuth = cache(async () => auth());

/** 同一請求內 Clerk currentUser 去重（註解：sync 時與 auth 分開呼叫）。 */
const getCachedCurrentUser = cache(async () => currentUser());

/**
 * 開發用：仍可用 header / debug cookie（註解：設 ALLOW_DEBUG_AUTH=true 時啟用）。
 */
async function getDebugTeamMemberFallback(): Promise<TeamMember | null> {
  if (!isDebugAuthEnabled()) return null;
  const h = await headers();
  const c = await cookies();
  const userId = h.get("x-debug-user-id") ?? c.get("debug-user-id")?.value ?? undefined;
  const teamId = h.get("x-debug-team-id") ?? c.get("debug-team-id")?.value ?? undefined;
  if (!userId || !teamId) return null;
  return getPrisma().teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
}

/** 依 active-team cookie 從隊籍列表選出作用中隊員（註解：無 cookie 取最早加入者）。 */
function pickActiveMember(
  memberships: TeamMember[],
  activeTeamId: string | undefined,
): TeamMember | null {
  if (memberships.length === 0) return null;
  if (activeTeamId) {
    const hit = memberships.find((m) => m.teamId === activeTeamId);
    if (hit) return hit;
  }
  return memberships[0] ?? null;
}

/** 同一請求內依 userId 載入 ACTIVE 隊籍（註解：getTeamMember 用）。 */
const loadActiveMemberships = cache(async (userId: string) => {
  return getPrisma().teamMember.findMany({
    where: { userId, status: MemberStatus.ACTIVE },
    orderBy: { createdAt: "asc" },
  });
});

/** 同一請求內依 userId 載入可切換隊伍（註解：header 下拉用）。 */
const loadActiveTeamsWithNames = cache(async (userId: string) => {
  return getPrisma().teamMember.findMany({
    where: { userId, status: MemberStatus.ACTIVE },
    include: { team: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
});

/**
 * 將 Clerk 使用者同步到 Prisma User（註解：依 clerkUserId；無則依 email 合併 bootstrap 建立的帳號）。
 */
async function syncClerkUserToDbImpl(clerkUserId: string) {
  const cu = await getCachedCurrentUser();
  const email =
    cu?.primaryEmailAddress?.emailAddress ??
    cu?.emailAddresses?.[0]?.emailAddress ??
    undefined;
  const name =
    cu?.fullName?.trim() ||
    ([cu?.firstName, cu?.lastName].filter(Boolean).join(" ").trim() || undefined);
  const avatarUrl = cu?.imageUrl ?? undefined;

  const prisma = getPrisma();

  const existingByClerk = await prisma.user.findUnique({
    where: { clerkUserId },
  });
  if (existingByClerk) {
    const nextEmail = email ?? existingByClerk.email;
    const nextName = name ?? existingByClerk.name;
    const nextAvatar = avatarUrl ?? existingByClerk.avatarUrl;
    if (
      nextEmail === existingByClerk.email &&
      nextName === existingByClerk.name &&
      nextAvatar === existingByClerk.avatarUrl
    ) {
      return existingByClerk;
    }
    return prisma.user.update({
      where: { id: existingByClerk.id },
      data: {
        email: nextEmail,
        name: nextName,
        avatarUrl: nextAvatar,
      },
    });
  }

  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      const nextName = name ?? byEmail.name;
      const nextAvatar = avatarUrl ?? byEmail.avatarUrl;
      if (byEmail.clerkUserId === clerkUserId && nextName === byEmail.name && nextAvatar === byEmail.avatarUrl) {
        return byEmail;
      }
      return prisma.user.update({
        where: { id: byEmail.id },
        data: { clerkUserId, name: nextName, avatarUrl: nextAvatar },
      });
    }
  }

  return prisma.user.create({
    data: {
      clerkUserId,
      email: email ?? undefined,
      name,
      avatarUrl,
    },
  });
}

/** 同一請求內 Clerk → Prisma User 同步去重（註解：依 clerkUserId）。 */
const syncClerkUserToDb = cache(syncClerkUserToDbImpl);

/**
 * 同步 Clerk → Prisma User（註解：不依賴已有 TeamMember；bootstrap／claim 用）。
 */
export const getOrSyncPrismaUserFromClerk = cache(async (): Promise<User | null> => {
  const debugMember = await getDebugTeamMemberFallback();
  if (debugMember) {
    const prisma = getPrisma();
    const row = await prisma.user.findUnique({ where: { id: debugMember.userId } });
    return row;
  }
  const { userId: clerkUserId } = await getCachedClerkAuth();
  if (!clerkUserId) return null;
  return syncClerkUserToDb(clerkUserId);
});

/**
 * 目前請求對應的 TeamMember（註解：Clerk 登入 + 可選 active-team cookie；多隊時切換隊伍用）。
 */
export const getTeamMember = cache(async (): Promise<TeamMember | null> => {
  const debug = await getDebugTeamMemberFallback();
  if (debug) {
    /** Debug 模式仍須尊重 active-team-id（註解：否則切換隊伍只改 cookie、頁面永遠讀 debug-team-id）。 */
    const c = await cookies();
    const activeTeamId = c.get(ACTIVE_TEAM_COOKIE)?.value;
    if (activeTeamId) {
      const hit = await getPrisma().teamMember.findFirst({
        where: {
          userId: debug.userId,
          teamId: activeTeamId,
          status: MemberStatus.ACTIVE,
        },
      });
      if (hit) return hit;
    }
    return debug;
  }

  const { userId: clerkUserId } = await getCachedClerkAuth();
  if (!clerkUserId) return null;

  const user = await syncClerkUserToDb(clerkUserId);
  const memberships = await loadActiveMemberships(user.id);
  const c = await cookies();
  return pickActiveMember(memberships, c.get(ACTIVE_TEAM_COOKIE)?.value);
});

/**
 * 目前帳號可切換的作用中隊伍列表（註解：多隊 header 下拉選單）。
 */
export const listActiveTeamsForSwitcher = cache(async (): Promise<{ id: string; name: string }[]> => {
  const debug = await getDebugTeamMemberFallback();

  if (debug) {
    const rows = await loadActiveTeamsWithNames(debug.userId);
    return rows.map((r) => ({ id: r.team.id, name: r.team.name }));
  }

  const { userId: clerkUserId } = await getCachedClerkAuth();
  if (!clerkUserId) return [];

  const user = await syncClerkUserToDb(clerkUserId);
  const rows = await loadActiveTeamsWithNames(user.id);
  return rows.map((r) => ({ id: r.team.id, name: r.team.name }));
});
