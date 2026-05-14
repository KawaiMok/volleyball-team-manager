import { auth, currentUser } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";

import type { TeamMember, User } from "@/generated/prisma/client";
import { MemberStatus } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

/** 目前作用中隊伍（註解：多隊時由 UI 寫入，供 getTeamMember 讀取）。 */
export const ACTIVE_TEAM_COOKIE_NAME = "active-team-id";
const ACTIVE_TEAM_COOKIE = ACTIVE_TEAM_COOKIE_NAME;

/**
 * 開發用：仍可用 header / debug cookie（註解：設 ALLOW_DEBUG_AUTH=true 時啟用）。
 */
async function getDebugTeamMemberFallback(): Promise<TeamMember | null> {
  if (process.env.ALLOW_DEBUG_AUTH !== "true") return null;
  const h = await headers();
  const c = await cookies();
  const userId = h.get("x-debug-user-id") ?? c.get("debug-user-id")?.value ?? undefined;
  const teamId = h.get("x-debug-team-id") ?? c.get("debug-team-id")?.value ?? undefined;
  if (!userId || !teamId) return null;
  return getPrisma().teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
  });
}

/**
 * 將 Clerk 使用者同步到 Prisma User（註解：依 clerkUserId；無則依 email 合併 bootstrap 建立的帳號）。
 */
async function syncClerkUserToDb(clerkUserId: string) {
  const cu = await currentUser();
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
    return prisma.user.update({
      where: { id: existingByClerk.id },
      data: {
        email: email ?? existingByClerk.email,
        name: name ?? existingByClerk.name,
        avatarUrl: avatarUrl ?? existingByClerk.avatarUrl,
      },
    });
  }

  if (email) {
    const byEmail = await prisma.user.findUnique({ where: { email } });
    if (byEmail) {
      return prisma.user.update({
        where: { id: byEmail.id },
        data: { clerkUserId, name: name ?? byEmail.name, avatarUrl: avatarUrl ?? byEmail.avatarUrl },
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

/**
 * 同步 Clerk → Prisma User（註解：不依賴已有 TeamMember；bootstrap／claim 用）。
 */
export async function getOrSyncPrismaUserFromClerk(): Promise<User | null> {
  const debugMember = await getDebugTeamMemberFallback();
  if (debugMember) {
    const prisma = getPrisma();
    const row = await prisma.user.findUnique({ where: { id: debugMember.userId } });
    return row;
  }
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;
  return syncClerkUserToDb(clerkUserId);
}

/**
 * 目前請求對應的 TeamMember（註解：Clerk 登入 + 可選 active-team cookie；多隊時切換隊伍用）。
 */
export async function getTeamMember(): Promise<TeamMember | null> {
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

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return null;

  const user = await syncClerkUserToDb(clerkUserId);
  const prisma = getPrisma();

  const memberships = await prisma.teamMember.findMany({
    where: { userId: user.id, status: MemberStatus.ACTIVE },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) return null;

  const c = await cookies();
  const activeTeamId = c.get(ACTIVE_TEAM_COOKIE)?.value;
  if (activeTeamId) {
    const hit = memberships.find((m) => m.teamId === activeTeamId);
    if (hit) return hit;
  }

  return memberships[0] ?? null;
}

/**
 * 目前帳號可切換的作用中隊伍列表（註解：多隊 header 下拉選單）。
 */
export async function listActiveTeamsForSwitcher(): Promise<{ id: string; name: string }[]> {
  const debug = await getDebugTeamMemberFallback();
  const prisma = getPrisma();

  if (debug) {
    const rows = await prisma.teamMember.findMany({
      where: { userId: debug.userId, status: MemberStatus.ACTIVE },
      include: { team: { select: { id: true, name: true } } },
      orderBy: { createdAt: "asc" },
    });
    return rows.map((r) => ({ id: r.team.id, name: r.team.name }));
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return [];

  const user = await syncClerkUserToDb(clerkUserId);
  const rows = await prisma.teamMember.findMany({
    where: { userId: user.id, status: MemberStatus.ACTIVE },
    include: { team: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({ id: r.team.id, name: r.team.name }));
}
