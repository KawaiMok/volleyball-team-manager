import { EventStatus, EventType, type PrismaClient } from "@/generated/prisma/client";
import {
  buildMemberFitnessTrends,
  type FitnessEventRecord,
  type FitnessSessionSnapshot,
} from "@/lib/fitness/aggregate";
import { computeAgeYears } from "@/lib/member-age";

/** 組裝 AI prompt 用的隊員體能脈絡（註解：近 5 場有紀錄的體測；不含姓名／隊名／事件名）。 */
export type MemberFitnessAiContext = {
  jerseyNumber: number | null;
  position: string | null;
  ageYears: number | null;
  birthDateIso: string | null;
  heightCm: number | null;
  weightKg: number | null;
  sessionCount: number;
  recentSessions: FitnessSessionSnapshot[];
};

/** 讀取隊員與近 5 次體測（註解：僅已結束且已發布的 FITNESS_TEST）。 */
export async function loadMemberFitnessAiContext(
  prisma: PrismaClient,
  teamId: string,
  memberId: string,
): Promise<MemberFitnessAiContext | null> {
  const member = await prisma.teamMember.findFirst({
    where: { id: memberId, teamId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!member) return null;

  const now = new Date();
  const fitnessEvents = await prisma.event.findMany({
    where: {
      teamId,
      type: EventType.FITNESS_TEST,
      status: EventStatus.PUBLISHED,
      endsAt: { lte: now },
      fitnessTestSession: { isNot: null },
    },
    select: {
      id: true,
      startsAt: true,
      fitnessTestSession: {
        select: {
          results: {
            where: { memberId },
            select: { memberId: true, stats: true, heightCm: true, weightKg: true },
          },
        },
      },
    },
    orderBy: { startsAt: "desc" },
    take: 50,
  });

  const records: FitnessEventRecord[] = fitnessEvents
    .filter((ev) => (ev.fitnessTestSession?.results.length ?? 0) > 0)
    .map((ev) => ({
      id: ev.id,
      /** 佔位標題（註解：不寫入 DeepSeek prompt）。 */
      title: "",
      startsAt: ev.startsAt,
      results: ev.fitnessTestSession!.results,
    }));

  const trends = buildMemberFitnessTrends(
    [
      {
        id: member.id,
        jerseyNumber: member.jerseyNumber,
        squad: member.squad,
        user: member.user,
      },
    ],
    records,
  );
  const trend = trends[0];
  const recentSessions = trend.sessions.slice(0, 5);

  const latestBody =
    recentSessions.find((s) => s.heightCm != null || s.weightKg != null) ?? recentSessions[0] ?? null;

  return {
    jerseyNumber: member.jerseyNumber,
    position: member.position,
    ageYears: computeAgeYears(member.birthDate),
    birthDateIso: member.birthDate ? member.birthDate.toISOString().slice(0, 10) : null,
    heightCm: latestBody?.heightCm ?? null,
    weightKg: latestBody?.weightKg ?? null,
    sessionCount: trend.sessionCount,
    recentSessions,
  };
}
