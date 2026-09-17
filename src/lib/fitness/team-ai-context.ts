import { EventStatus, EventType, MemberStatus, type PrismaClient } from "@/generated/prisma/client";
import {
  buildMemberFitnessTrends,
  type FitnessEventRecord,
  type FitnessSessionSnapshot,
} from "@/lib/fitness/aggregate";
import { computeAgeYears } from "@/lib/member-age";
import { parseMemberFitnessAiAnalysis, type MemberFitnessAiAnalysis } from "@/lib/team-fitness-ai-schema";

/** 單一選手 AI 輸入列（註解：playerKey 供 DeepSeek 匿名識別）。 */
export type TeamPlayerFitnessAiRow = {
  memberId: string;
  playerKey: string;
  /** 顯示姓名（註解：僅伺服器端還原 AI 代號，不送入 prompt）。 */
  displayName: string;
  jerseyNumber: number | null;
  position: string | null;
  ageYears: number | null;
  heightCm: number | null;
  weightKg: number | null;
  sessionCount: number;
  recentSessions: FitnessSessionSnapshot[];
  analysis: MemberFitnessAiAnalysis | null;
};

/** 全隊體能 AI 脈絡（註解：不含姓名、隊名、事件名）。 */
export type TeamFitnessAiContext = {
  players: TeamPlayerFitnessAiRow[];
  /** 最新一批體能分析 batchId（註解：訓練建議需引用）。 */
  latestAnalysisBatchId: string | null;
  latestAnalysisAt: string | null;
};

/** 讀取全隊在籍選手與近 5 次體測（註解：含已存體能分析結果）。 */
export async function loadTeamFitnessAiContext(
  prisma: PrismaClient,
  teamId: string,
): Promise<TeamFitnessAiContext> {
  const members = await prisma.teamMember.findMany({
    where: { teamId, status: MemberStatus.ACTIVE },
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ jerseyNumber: "asc" }, { createdAt: "asc" }],
  });

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
      title: "",
      startsAt: ev.startsAt,
      results: ev.fitnessTestSession!.results,
    }));

  const trends = buildMemberFitnessTrends(
    members.map((m) => ({
      id: m.id,
      jerseyNumber: m.jerseyNumber,
      squad: m.squad,
      user: m.user,
    })),
    records,
  );
  const trendByMember = new Map(trends.map((t) => [t.memberId, t]));

  let latestAnalysisBatchId: string | null = null;
  let latestAnalysisAt: string | null = null;

  const players: TeamPlayerFitnessAiRow[] = members.map((m, index) => {
    const trend = trendByMember.get(m.id);
    const recentSessions = (trend?.sessions ?? []).slice(0, 5);
    const latestBody =
      recentSessions.find((s) => s.heightCm != null || s.weightKg != null) ?? recentSessions[0] ?? null;
    const analysis = parseMemberFitnessAiAnalysis(m.fitnessAiReport);

    if (analysis) {
      if (
        !latestAnalysisAt ||
        new Date(analysis.generatedAt).getTime() > new Date(latestAnalysisAt).getTime()
      ) {
        latestAnalysisAt = analysis.generatedAt;
        latestAnalysisBatchId = analysis.batchId;
      }
    }

    return {
      memberId: m.id,
      playerKey: `P${index + 1}`,
      displayName: m.user.name ?? m.user.email ?? m.id.slice(0, 8),
      jerseyNumber: m.jerseyNumber,
      position: m.position,
      ageYears: computeAgeYears(m.birthDate),
      heightCm: latestBody?.heightCm ?? null,
      weightKg: latestBody?.weightKg ?? null,
      sessionCount: trend?.sessionCount ?? 0,
      recentSessions,
      analysis,
    };
  });

  return { players, latestAnalysisBatchId, latestAnalysisAt };
}

/** 依 batchId 取該批分析結果（註解：訓練建議 prompt 用）。 */
export function pickAnalysisBatch(
  players: TeamPlayerFitnessAiRow[],
  batchId: string | null,
): TeamPlayerFitnessAiRow[] {
  if (!batchId) return [];
  return players
    .filter((p) => p.analysis?.batchId === batchId)
    .sort((a, b) => (a.analysis?.rank ?? 999) - (b.analysis?.rank ?? 999));
}
