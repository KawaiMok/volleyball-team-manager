import {
  FITNESS_TEST_ITEMS,
  FITNESS_TEST_ITEM_BY_KEY,
  normalizeFitnessStats,
  type FitnessTestItemKey,
  type FitnessTestStats,
} from "@/lib/fitness/test-schema";

/** 單場體能測試快照（註解：依事件時間排序）。 */
export type FitnessSessionSnapshot = {
  eventId: string;
  eventTitle: string;
  startsAtIso: string;
  stats: FitnessTestStats;
};

/** 隊員體能趨勢列（註解：最新 vs 上一場 Δ）。 */
export type MemberFitnessTrendRow = {
  memberId: string;
  displayName: string;
  jerseyNumber: number | null;
  squad: string | null;
  sessionCount: number;
  latest: FitnessSessionSnapshot | null;
  previous: FitnessSessionSnapshot | null;
  /** 正值代表進步（註解：折返跑為秒數減少也算進步）。 */
  deltas: Record<FitnessTestItemKey, number | null>;
};

export type FitnessEventRecord = {
  id: string;
  title: string;
  startsAt: Date;
  results: Array<{ memberId: string; stats: unknown }>;
};

/** 計算單項進步量（註解：折返跑越小越好，其餘越大越好）。 */
export function computeFitnessDelta(
  key: FitnessTestItemKey,
  latestBest: number | null,
  previousBest: number | null,
): number | null {
  if (latestBest == null || previousBest == null) return null;
  const def = FITNESS_TEST_ITEM_BY_KEY[key];
  const raw = latestBest - previousBest;
  return def.higherIsBetter ? raw : -raw;
}

/** 由已結束體能測試事件建隊員趨勢（註解：每位隊員依時間序取最近兩場）。 */
export function buildMemberFitnessTrends(
  members: Array<{
    id: string;
    jerseyNumber: number | null;
    squad: string | null;
    user: { name: string | null; email: string | null };
  }>,
  fitnessEvents: FitnessEventRecord[],
): MemberFitnessTrendRow[] {
  const memberMeta = new Map(
    members.map((m) => [
      m.id,
      {
        displayName: m.user.name ?? m.user.email ?? m.id.slice(0, 8),
        jerseyNumber: m.jerseyNumber,
        squad: m.squad,
      },
    ]),
  );

  /** memberId → snapshots 新→舊 */
  const byMember = new Map<string, FitnessSessionSnapshot[]>();

  for (const ev of fitnessEvents) {
    for (const row of ev.results) {
      const stats = normalizeFitnessStats(row.stats);
      const hasAny = FITNESS_TEST_ITEMS.some((item) => stats[item.key].best != null);
      if (!hasAny) continue;
      const snap: FitnessSessionSnapshot = {
        eventId: ev.id,
        eventTitle: ev.title,
        startsAtIso: ev.startsAt.toISOString(),
        stats,
      };
      const list = byMember.get(row.memberId) ?? [];
      list.push(snap);
      byMember.set(row.memberId, list);
    }
  }

  return members.map((m) => {
    const meta = memberMeta.get(m.id);
    const sessions = byMember.get(m.id) ?? [];
    const latest = sessions[0] ?? null;
    const previous = sessions[1] ?? null;
    const deltas = Object.fromEntries(
      FITNESS_TEST_ITEMS.map((item) => [
        item.key,
        computeFitnessDelta(
          item.key,
          latest?.stats[item.key].best ?? null,
          previous?.stats[item.key].best ?? null,
        ),
      ]),
    ) as Record<FitnessTestItemKey, number | null>;

    return {
      memberId: m.id,
      displayName: meta?.displayName ?? m.id.slice(0, 8),
      jerseyNumber: meta?.jerseyNumber ?? null,
      squad: meta?.squad ?? null,
      sessionCount: sessions.length,
      latest,
      previous,
      deltas,
    };
  });
}
