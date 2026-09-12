import Link from "next/link";

import { PlayerFitnessHistoryList } from "@/components/player-fitness-history-list";
import { EventStatus, EventType } from "@/generated/prisma/client";
import { normalizeFitnessStats } from "@/lib/fitness/test-schema";
import { getTeamMember } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";

/** 我的體能測試歷史（註解：Phase 1.5；列出已結束場次 personal best）。 */
export default async function PlayerFitnessHistoryPage() {
  const member = await getTeamMember();
  if (!member) return null;

  const prisma = getPrisma();
  const now = new Date();

  const rows = await prisma.fitnessTestResult.findMany({
    where: {
      memberId: member.id,
      session: {
        event: {
          teamId: member.teamId,
          type: EventType.FITNESS_TEST,
          status: EventStatus.PUBLISHED,
          endsAt: { lte: now },
        },
      },
    },
    include: {
      session: {
        include: {
          event: {
            select: { id: true, title: true, startsAt: true },
          },
        },
      },
    },
    orderBy: { session: { event: { startsAt: "desc" } } },
    take: 100,
  });

  const items = rows.map((row) => ({
    eventId: row.session.event.id,
    eventTitle: row.session.event.title,
    eventStartsAt: row.session.event.startsAt.toISOString(),
    stats: normalizeFitnessStats(row.stats),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/player" className="text-sm text-blue-600 hover:underline md:hidden">
          ← 我的行程
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight md:mt-0">我的體能</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          歷次體能測試的最佳成績；點選場次可查看各次嘗試詳情。
        </p>
      </div>

      <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:divide-slate-700 dark:border-slate-700 dark:bg-zinc-900">
        <PlayerFitnessHistoryList items={items} />
      </ul>
    </div>
  );
}
