import { MemberStatus } from "@/generated/prisma/client";
import type { ParticipantRule } from "@/lib/participant-rule-types";
import { getPrisma } from "@/lib/prisma";

export type { ParticipantRule } from "@/lib/participant-rule-types";

/**
 * 依規則展開「要列入事件的 TeamMember.id」（註解：ALL = 該隊 ACTIVE；MEMBERS 僅含同隊且 ACTIVE 的 id）。
 */
export async function resolveParticipantMemberIds(
  teamId: string,
  rule: ParticipantRule,
): Promise<string[]> {
  if (rule.kind === "ALL") {
    const rows = await getPrisma().teamMember.findMany({
      where: { teamId, status: MemberStatus.ACTIVE },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
  if (rule.kind === "SQUADS") {
    const rows = await getPrisma().teamMember.findMany({
      where: {
        teamId,
        status: MemberStatus.ACTIVE,
        squad: { in: rule.squads },
      },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }
  const unique = [...new Set(rule.memberIds)];
  const rows = await getPrisma().teamMember.findMany({
    where: {
      teamId,
      status: MemberStatus.ACTIVE,
      id: { in: unique },
    },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** MEMBERS 規則是否每個 id 都有效（註解：供 API 回 400）。 */
export async function isMemberParticipantRuleFullyValid(
  teamId: string,
  rule: Extract<ParticipantRule, { kind: "MEMBERS" }>,
): Promise<boolean> {
  const unique = [...new Set(rule.memberIds)];
  const resolved = await resolveParticipantMemberIds(teamId, rule);
  return resolved.length === unique.length && unique.length > 0;
}
