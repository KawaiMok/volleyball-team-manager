import { MemberStatus } from "@/generated/prisma/client";
import type { ParticipantRule } from "@/lib/participant-rule-types";
import { getPrisma } from "@/lib/prisma";

type RosterRow = { id: string; squad: string | null };

/** 比對兩組 memberId 是否相同（註解：順序無關）。 */
function sameMemberSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((id, i) => id === sb[i]);
}

/** 由記憶體內 roster 展開規則（註解：避免 SQUADS 子集組合爆炸式 DB 查詢）。 */
function resolveMemberIdsFromRoster(roster: RosterRow[], rule: ParticipantRule): string[] {
  if (rule.kind === "ALL") {
    return roster.map((r) => r.id);
  }
  if (rule.kind === "SQUADS") {
    const squadSet = new Set(rule.squads);
    return roster.filter((r) => r.squad != null && squadSet.has(r.squad)).map((r) => r.id);
  }
  const idSet = new Set(rule.memberIds);
  return roster.filter((r) => idSet.has(r.id)).map((r) => r.id);
}

/**
 * 由 roster 反推 UI 規則（註解：優先 ALL，再嘗試分組子集組合，否則 MEMBERS；純記憶體）。
 */
export function inferParticipantRuleFromRoster(
  roster: RosterRow[],
  participantMemberIds: string[],
  configuredSquads: string[],
): ParticipantRule {
  const distinct = [...new Set(participantMemberIds)];
  const allActive = roster.map((r) => r.id);
  if (sameMemberSet(distinct, allActive)) {
    return { kind: "ALL" };
  }

  const squads = [...new Set(configuredSquads)].filter((s) => s.length > 0);
  const n = squads.length;
  if (n > 0) {
    for (let mask = 1; mask < 1 << n; mask++) {
      const combo: string[] = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) combo.push(squads[i]);
      }
      const resolved = resolveMemberIdsFromRoster(roster, { kind: "SQUADS", squads: combo });
      if (sameMemberSet(distinct, resolved)) {
        return { kind: "SQUADS", squads: combo };
      }
    }
  }

  return { kind: "MEMBERS", memberIds: distinct.sort() };
}

/**
 * 由「目前已展開的參與者」反推 UI 規則（註解：單次 DB 查 roster 後記憶體比對）。
 */
export async function inferParticipantRule(
  teamId: string,
  participantMemberIds: string[],
  configuredSquads: string[],
): Promise<ParticipantRule> {
  const roster = await getPrisma().teamMember.findMany({
    where: { teamId, status: MemberStatus.ACTIVE },
    select: { id: true, squad: true },
  });
  return inferParticipantRuleFromRoster(roster, participantMemberIds, configuredSquads);
}
