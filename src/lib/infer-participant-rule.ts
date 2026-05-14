import type { ParticipantRule } from "@/lib/participant-rule-types";
import { resolveParticipantMemberIds } from "@/lib/participant-rule";

/** 比對兩組 memberId 是否相同（註解：順序無關）。 */
function sameMemberSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((id, i) => id === sb[i]);
}

/**
 * 由「目前已展開的參與者」反推 UI 規則（註解：優先 ALL，再嘗試分組子集組合，否則視為指名 MEMBERS）。
 */
export async function inferParticipantRule(
  teamId: string,
  participantMemberIds: string[],
  configuredSquads: string[],
): Promise<ParticipantRule> {
  const distinct = [...new Set(participantMemberIds)];
  const allActive = await resolveParticipantMemberIds(teamId, { kind: "ALL" });
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
      const resolved = await resolveParticipantMemberIds(teamId, { kind: "SQUADS", squads: combo });
      if (sameMemberSet(distinct, resolved)) {
        return { kind: "SQUADS", squads: combo };
      }
    }
  }

  return { kind: "MEMBERS", memberIds: distinct.sort() };
}
