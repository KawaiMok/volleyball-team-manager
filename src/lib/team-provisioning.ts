import { MemberStatus, OrganizationRole, TeamRole, type TeamRole as TeamRoleType } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";

export type ProvisionTeamMemberInput = {
  teamId: string;
  email: string;
  role: TeamRoleType;
  jerseyNumber?: number | null;
  squad?: string | null;
  displayName?: string | null;
  position?: string | null;
  phone?: string | null;
  notes?: string | null;
  /** 是否允許設 ADMIN（註解：org 開通時 true；隊內 COACH 新增時依 isTeamAdmin）。 */
  allowAdminRole?: boolean;
};

type ProvisionedMember = Awaited<ReturnType<typeof provisionTeamMemberImpl>>["row"];

export type ProvisionTeamMemberResult =
  | { ok: true; member: ProvisionedMember; reactivated?: boolean }
  | { ok: false; status: number; error: string; memberId?: string };

/** 依 Email 取得或建立 User（註解：Clerk 首次登入會合併 clerkUserId）。 */
export async function findOrCreateUserByEmail(email: string, displayName?: string | null) {
  const emailNorm = email.trim().toLowerCase();
  const displayTrim = displayName?.trim() || null;
  const prisma = getPrisma();

  let user = await prisma.user.findUnique({ where: { email: emailNorm } });
  if (!user) {
    user = await prisma.user.create({
      data: { email: emailNorm, name: displayTrim ?? undefined },
    });
  } else if (displayTrim && !(user.name && user.name.trim())) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { name: displayTrim },
    });
  }
  return user;
}

/** 依 Email 取得或建立 User 並加入 OrganizationMember（註解：組織管理員指派）。 */
export async function findOrCreateOrgMember(input: {
  organizationId: string;
  email: string;
  role: OrganizationRole;
  displayName?: string | null;
}) {
  const user = await findOrCreateUserByEmail(input.email, input.displayName);
  const prisma = getPrisma();

  const existing = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId: input.organizationId, userId: user.id },
    },
  });

  if (existing) {
    if (existing.status === MemberStatus.ACTIVE) {
      return prisma.organizationMember.update({
        where: { id: existing.id },
        data: { role: input.role },
        include: { user: { select: { id: true, email: true, name: true, clerkUserId: true } } },
      });
    }
    return prisma.organizationMember.update({
      where: { id: existing.id },
      data: { role: input.role, status: MemberStatus.ACTIVE },
      include: { user: { select: { id: true, email: true, name: true, clerkUserId: true } } },
    });
  }

  return prisma.organizationMember.create({
    data: {
      organizationId: input.organizationId,
      userId: user.id,
      role: input.role,
      status: MemberStatus.ACTIVE,
    },
    include: { user: { select: { id: true, email: true, name: true, clerkUserId: true } } },
  });
}

async function provisionTeamMemberImpl(input: ProvisionTeamMemberInput) {
  const prisma = getPrisma();
  const user = await findOrCreateUserByEmail(input.email, input.displayName);

  const dup = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: input.teamId, userId: user.id } },
  });

  const squadTrim = input.squad?.trim();
  const positionTrim = input.position?.trim() || null;
  const phoneTrim = input.phone?.trim() || null;
  const notesTrim = input.notes?.trim() || null;

  if (dup) {
    if (dup.status === MemberStatus.ACTIVE) {
      throw Object.assign(new Error("DUPLICATE_ACTIVE"), { memberId: dup.id });
    }

    if (input.jerseyNumber != null) {
      const clash = await prisma.teamMember.findFirst({
        where: {
          teamId: input.teamId,
          jerseyNumber: input.jerseyNumber,
          NOT: { id: dup.id },
        },
      });
      if (clash) throw Object.assign(new Error("JERSEY_CLASH"), {});
    }

    const row = await prisma.teamMember.update({
      where: { id: dup.id },
      data: {
        role: input.role,
        status: MemberStatus.ACTIVE,
        jerseyNumber: input.jerseyNumber ?? undefined,
        squad: squadTrim || undefined,
        position: positionTrim ?? undefined,
        phone: phoneTrim ?? undefined,
        notes: notesTrim ?? undefined,
      },
      include: {
        user: { select: { id: true, email: true, name: true, clerkUserId: true } },
      },
    });
    return { row, reactivated: true as const };
  }

  if (input.jerseyNumber != null) {
    const clash = await prisma.teamMember.findFirst({
      where: { teamId: input.teamId, jerseyNumber: input.jerseyNumber },
    });
    if (clash) throw Object.assign(new Error("JERSEY_CLASH"), {});
  }

  const row = await prisma.teamMember.create({
    data: {
      teamId: input.teamId,
      userId: user.id,
      role: input.role,
      status: MemberStatus.ACTIVE,
      jerseyNumber: input.jerseyNumber ?? undefined,
      squad: squadTrim || undefined,
      position: positionTrim ?? undefined,
      phone: phoneTrim ?? undefined,
      notes: notesTrim ?? undefined,
    },
    include: {
      user: { select: { id: true, email: true, name: true, clerkUserId: true } },
    },
  });
  return { row, reactivated: false as const };
}

/**
 * 依 Email 建立／連結使用者並加入隊伍（註解：org 開通與 /api/team/members 共用）。
 * allowAdminRole 為 false 時不可設 ADMIN（由呼叫端在 org 路徑設 true）。
 */
export async function provisionTeamMember(
  input: ProvisionTeamMemberInput,
): Promise<ProvisionTeamMemberResult> {
  if (input.role === TeamRole.ADMIN && !input.allowAdminRole) {
    return { ok: false, status: 403, error: "僅管理員可將新成員設為管理員" };
  }

  try {
    const result = await provisionTeamMemberImpl(input);
    return {
      ok: true,
      member: result.row,
      reactivated: result.reactivated,
    };
  } catch (e) {
    const err = e as Error & { memberId?: string };
    if (err.message === "DUPLICATE_ACTIVE") {
      return {
        ok: false,
        status: 409,
        error: "此信箱已在名單中（在籍）。請至隊員名單編輯，勿重複新增。",
        memberId: err.memberId,
      };
    }
    if (err.message === "JERSEY_CLASH") {
      return { ok: false, status: 400, error: "背號與既有隊員衝突" };
    }
    throw e;
  }
}
