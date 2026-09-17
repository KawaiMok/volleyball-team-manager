import Link from "next/link";

import { addDays } from "@/app/coach/(main)/calendar/calendar-utils";
import {
  CoachDashboardProvider,
  CoachDashboardSettingsPanel,
} from "@/app/coach/(main)/coach-dashboard-prefs";
import { CoachDashboardView } from "@/app/coach/(main)/coach-dashboard-view";
import type { DashboardEventTypeKey } from "@/app/coach/(main)/coach-dashboard-ui";
import type { DashboardRosterMember } from "@/app/coach/(main)/coach-dashboard-roster-section";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import type { EventStatusKey } from "@/components/domain-status-indicators";
import { getDebugTeamMember } from "@/lib/debug-session";
import { buildDailyRpeSeries } from "@/lib/coach-dashboard-rpe-series";
import { buildMemberFitnessTrends, toDashboardFitnessProfile } from "@/lib/fitness/aggregate";
import { parseMemberFitnessAiAnalysis, parseTeamFitnessTrainingAdvice } from "@/lib/team-fitness-ai-schema";
import { getSportModule } from "@/lib/sports/registry";
import { prismaSportToId } from "@/lib/sports/registry-server";
import type { PlayerStatsRecord } from "@/lib/sports/match/types";
import { getPrisma } from "@/lib/prisma";
import { EventStatus, EventType, MemberStatus, RsvpStatus } from "@/generated/prisma/client";
import { formatDateTimeZh } from "@/lib/format-datetime";

function buildDashboardMatchTotals(
  members: Array<{
    id: string;
    user: { name: string | null; email: string | null };
  }>,
  matchEvents: Array<{
    matchResult: {
      playerStats: Array<{ memberId: string; stats: unknown }>;
    } | null;
  }>,
  matchMod: NonNullable<ReturnType<typeof getSportModule>["match"]>,
): Map<
  string,
  { matchCount: number; stats: PlayerStatsRecord; overall: number | null }
> {
  const totals = new Map<
    string,
    { matchCount: number; stats: PlayerStatsRecord; overall: number | null }
  >();

  for (const m of members) {
    totals.set(m.id, {
      matchCount: 0,
      stats: matchMod.emptyPlayerStats(),
      overall: null,
    });
  }

  for (const ev of matchEvents) {
    for (const row of ev.matchResult?.playerStats ?? []) {
      const normalized = matchMod.normalizePlayerStats(row.stats);
      if (!matchMod.hasAnyPlayerStats(normalized)) continue;
      const existing = totals.get(row.memberId);
      if (!existing) continue;
      existing.matchCount += 1;
      existing.stats = matchMod.addPlayerStats(existing.stats, normalized);
    }
  }

  for (const row of totals.values()) {
    row.overall = row.matchCount > 0 ? matchMod.computeOverallIndicator(row.stats) : null;
  }

  return totals;
}

function formatDashboardEventTime(iso: string) {
  return formatDateTimeZh(new Date(iso), {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 教練總覽：服務入口 + BottomSheet 操作（註解：首屏只顯示少數功能 logo）。 */
export default async function CoachDashboardPage() {
  const member = await getDebugTeamMember();
  if (!member) return null;

  const prisma = getPrisma();
  const team = await prisma.team.findUnique({
    where: { id: member.teamId },
    select: { sport: true, fitnessTeamTrainingAdvice: true },
  });
  const sportMod = team ? getSportModule(prismaSportToId(team.sport)) : null;
  const showLiveTactical = sportMod?.capabilities.liveTactical ?? false;

  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [upcoming, draftCount, recentEvents, members, fitnessEvents, matchEvents] = await Promise.all([
    prisma.event.findMany({
      where: {
        teamId: member.teamId,
        startsAt: { gte: now, lte: weekLater },
        status: { not: EventStatus.CANCELLED },
      },
      orderBy: { startsAt: "asc" },
      take: 24,
      include: {
        _count: { select: { participants: true } },
      },
    }),
    prisma.event.count({
      where: { teamId: member.teamId, status: EventStatus.DRAFT },
    }),
    prisma.event.findMany({
      where: {
        teamId: member.teamId,
        status: EventStatus.PUBLISHED,
        endsAt: { lte: now },
      },
      orderBy: { endsAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        type: true,
        startsAt: true,
        endsAt: true,
      },
    }),
    prisma.teamMember.findMany({
      where: { teamId: member.teamId, status: MemberStatus.ACTIVE },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ role: "asc" }, { jerseyNumber: "asc" }, { createdAt: "asc" }],
    }),
    prisma.event.findMany({
      where: {
        teamId: member.teamId,
        status: EventStatus.PUBLISHED,
        endsAt: { lte: now },
        type: EventType.FITNESS_TEST,
      },
      select: {
        id: true,
        title: true,
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
    }),
    prisma.event.findMany({
      where: {
        teamId: member.teamId,
        status: EventStatus.PUBLISHED,
        endsAt: { lte: now },
        type: EventType.MATCH,
      },
      select: {
        matchResult: {
          select: {
            playerStats: { select: { memberId: true, stats: true } },
          },
        },
      },
      orderBy: { endsAt: "desc" },
      take: 200,
    }),
  ]);

  const eventIds = upcoming.map((e) => e.id);

  const unansweredGroups =
    eventIds.length === 0 ?
      []
    : await prisma.attendance.groupBy({
        by: ["eventId"],
        where: {
          eventId: { in: eventIds },
          rsvpStatus: RsvpStatus.UNANSWERED,
        },
        _count: { _all: true },
      });

  const unansweredByEvent = Object.fromEntries(
    unansweredGroups.map((g) => [g.eventId, g._count._all]),
  );
  const participantsByEvent = Object.fromEntries(
    upcoming.map((e) => [e.id, e._count.participants]),
  );

  const needsRsvpFollowUp = upcoming.filter(
    (ev) =>
      ev.status === EventStatus.PUBLISHED &&
      (unansweredByEvent[ev.id] ?? 0) > 0,
  );

  const todayTrainingEvents = await prisma.event.findMany({
    where: {
      teamId: member.teamId,
      type: EventType.TRAINING,
      status: EventStatus.PUBLISHED,
      startsAt: { gte: startOfToday, lte: endOfToday },
    },
    select: { id: true, title: true },
    orderBy: { startsAt: "asc" },
  });
  const todayTrainingIds = todayTrainingEvents.map((e) => e.id);

  const [todayFeedbackRows, rpeTrendFeedback] = await Promise.all([
    todayTrainingIds.length === 0 ?
      Promise.resolve([])
    : prisma.feedback.findMany({
        where: { eventId: { in: todayTrainingIds } },
        select: { rpe: true, fatigue: true, painLevel: true },
      }),
    prisma.feedback.findMany({
      where: {
        event: { teamId: member.teamId },
        submittedAt: { gte: addDays(startOfToday, -45) },
      },
      select: { submittedAt: true, rpe: true },
    }),
  ]);

  const rpeSeries = buildDailyRpeSeries(
    rpeTrendFeedback.map((f) => ({ submittedAt: f.submittedAt, rpe: f.rpe })),
    startOfToday,
    30,
  );

  const fatigueAgg = { LOW: 0, MED: 0, HIGH: 0 };
  const painAgg = { NONE: 0, MILD: 0, SEVERE: 0 };
  let rpeSum = 0;
  for (const f of todayFeedbackRows) {
    rpeSum += f.rpe;
    fatigueAgg[f.fatigue]++;
    painAgg[f.painLevel]++;
  }
  const fbN = todayFeedbackRows.length;
  const avgRpeToday = fbN > 0 ? rpeSum / fbN : null;

  const matchMod = sportMod?.match ?? null;
  const fitnessTrendRows = buildMemberFitnessTrends(
    members,
    fitnessEvents
      .filter((ev) => ev.fitnessTestSession)
      .map((ev) => ({
        id: ev.id,
        title: ev.title,
        startsAt: ev.startsAt,
        results: ev.fitnessTestSession!.results,
      })),
  );
  const fitnessByMember = new Map(fitnessTrendRows.map((r) => [r.memberId, r]));
  const matchTotals =
    matchMod && sportMod?.capabilities.matchStats ?
      buildDashboardMatchTotals(members, matchEvents, matchMod)
    : new Map();
  const rosterMembers: DashboardRosterMember[] = members.map((m) => {
    const fitnessRow = fitnessByMember.get(m.id);
    const matchRow = matchTotals.get(m.id);
    return {
      memberId: m.id,
      displayName: m.user.name ?? m.user.email ?? m.id.slice(0, 8),
      jerseyNumber: m.jerseyNumber,
      position: m.position,
      squad: m.squad,
      birthDate: m.birthDate ? m.birthDate.toISOString().slice(0, 10) : null,
      fitnessAnalysis: parseMemberFitnessAiAnalysis(m.fitnessAiReport),
      fitness: toDashboardFitnessProfile(
        fitnessRow ?? {
          memberId: m.id,
          displayName: m.user.name ?? m.user.email ?? m.id.slice(0, 8),
          jerseyNumber: m.jerseyNumber,
          squad: m.squad,
          sessionCount: 0,
          sessions: [],
          latest: null,
          previous: null,
          deltas: {
            squatJump: null,
            cmj: null,
            approachJump: null,
            depthJump: null,
            courtShuttle: null,
            medicineBallThrow: null,
          },
        },
      ),
      match:
        matchRow && matchRow.matchCount > 0 ?
          {
            matchCount: matchRow.matchCount,
            overall: matchRow.overall,
            stats: matchRow.stats,
          }
        : null,
    };
  });

  return (
    <CoachDashboardProvider>
      <div className="space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">總覽</h1>
            <HintExclamationToggle>
              <span>
                點選下方入口查看詳情。前往{" "}
                <Link href="/coach/calendar" className="font-medium text-blue-600 hover:underline">
                  行事曆
                </Link>
                。
              </span>
            </HintExclamationToggle>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">隊伍快捷服務入口</p>
        </div>

        <CoachDashboardSettingsPanel hiddenWidgets={showLiveTactical ? [] : ["liveTactical"]} />

        <CoachDashboardView
          draftCount={draftCount}
          upcoming={upcoming.map((ev) => ({
            id: ev.id,
            title: ev.title,
            type: ev.type as DashboardEventTypeKey,
            status: ev.status as EventStatusKey,
            startsAtLabel: formatDashboardEventTime(ev.startsAt.toISOString()),
          }))}
          recentEvents={recentEvents.map((ev) => ({
            id: ev.id,
            title: ev.title,
            type: ev.type as DashboardEventTypeKey,
            startsAtLabel: formatDashboardEventTime(ev.startsAt.toISOString()),
          }))}
          rosterMembers={rosterMembers}
          teamFitnessTrainingAdvice={parseTeamFitnessTrainingAdvice(team?.fitnessTeamTrainingAdvice ?? null)}
          needsRsvpFollowUp={needsRsvpFollowUp.map((ev) => ({
            id: ev.id,
            title: ev.title,
            type: ev.type as DashboardEventTypeKey,
            status: ev.status as EventStatusKey,
            startsAtLabel: formatDashboardEventTime(ev.startsAt.toISOString()),
          }))}
          unansweredByEvent={unansweredByEvent}
          participantsByEvent={participantsByEvent}
          todayTrainingEvents={todayTrainingEvents}
          feedbackCount={fbN}
          avgRpeToday={avgRpeToday}
          fatigueAgg={fatigueAgg}
          painAgg={painAgg}
          rpeSeries={rpeSeries}
          showLiveTactical={showLiveTactical}
        />
      </div>
    </CoachDashboardProvider>
  );
}
