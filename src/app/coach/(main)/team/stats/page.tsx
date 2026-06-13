import Link from "next/link";
import { notFound } from "next/navigation";

import { CoachEventDetailCollapsibleSection } from "@/components/coach-event-detail-collapsible-section";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { SportFeatureComingSoon } from "@/components/sport-feature-coming-soon";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getSportModule } from "@/lib/sports/registry";
import { prismaSportToId } from "@/lib/sports/registry-server";
import { fatigueLabel, fatigueLevelIndex, painLabel, painLevelIndex } from "@/lib/feedback-display";
import { getPrisma } from "@/lib/prisma";
import { formatDateTimeZh } from "@/lib/format-datetime";
import { EventStatus, MemberStatus } from "@/generated/prisma/client";
import { MemberStatsTable, type MemberStatsTableRow } from "@/app/coach/(main)/team/stats/member-stats-table";
import { MatchStatsTotalsToggle } from "@/app/coach/(main)/team/stats/match-stats-totals-toggle";
import { MatchQuickIndicators, type QuickIndicatorRow } from "@/app/coach/(main)/team/stats/match-quick-indicators";
import { MatchStandoutCards } from "@/app/coach/(main)/team/stats/match-standout-cards";
import type { PlayerStatsRecord } from "@/lib/sports/match/types";
import { computeStandoutWinners } from "@/lib/sports/match/standout";

type MemberRow = {
  memberId: string;
  displayName: string;
  squad: string | null;
  jerseyNumber: number | null;
  eligibleEvents: number;
  attendedEvents: number;
  attendanceRatePct: number | null;
  feedbackCount: number;
  avgRpe: number | null;
  avgFatigueIndex: number | null;
  avgPainIndex: number | null;
  mostRecentFeedbackAt: Date | null;
};

function pct(part: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((part / total) * 1000) / 10;
}

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((s, x) => s + x, 0) / nums.length;
}

function topN<T>(rows: T[], n: number): T[] {
  return rows.slice(0, Math.max(0, n));
}

function addMatchStats(a: PlayerStatsRecord, b: PlayerStatsRecord, matchMod: NonNullable<ReturnType<typeof getSportModule>["match"]>): PlayerStatsRecord {
  return matchMod.addPlayerStats(a, b);
}

type MatchTotalRow = {
  memberId: string;
  displayName: string;
  jerseyNumber: number | null;
  squad: string | null;
  position: string | null;
  matchCount: number;
  stats: PlayerStatsRecord;
};

/** 累計比賽個人數據（註解：供突出者榜單與快速指標共用）。 */
function buildMatchTotals(
  members: Array<{
    id: string;
    jerseyNumber: number | null;
    squad: string | null;
    position: string | null;
    user: { name: string | null; email: string | null };
  }>,
  matchEvents: Array<{
    matchResult: {
      playerStats: Array<{ memberId: string; stats: unknown }>;
    } | null;
  }>,
  matchMod: NonNullable<ReturnType<typeof getSportModule>["match"]>,
): MatchTotalRow[] {
  const totals = new Map<string, MatchTotalRow>();

  for (const m of members) {
    totals.set(m.id, {
      memberId: m.id,
      displayName: m.user.name ?? m.user.email ?? m.id.slice(0, 8),
      jerseyNumber: m.jerseyNumber,
      squad: m.squad,
      position: m.position,
      matchCount: 0,
      stats: matchMod.emptyPlayerStats(),
    });
  }

  for (const ev of matchEvents) {
    const ps = ev.matchResult?.playerStats ?? [];
    for (const row of ps) {
      const normalized = matchMod.normalizePlayerStats(row.stats);
      if (!matchMod.hasAnyPlayerStats(normalized)) continue;
      const existing = totals.get(row.memberId);
      if (!existing) continue;
      existing.matchCount += 1;
      existing.stats = addMatchStats(existing.stats, normalized, matchMod);
    }
  }

  return Array.from(totals.values()).filter((r) => r.matchCount > 0);
}

/** 教練端：隊伍統計（註解：第一版以「出席 + 回饋」為主，樣本＝已發布且已結束之事件）。 */
export default async function CoachTeamStatsPage() {
  const member = await getDebugTeamMember();
  if (!member) return null;

  const prisma = getPrisma();
  const team = await prisma.team.findUnique({
    where: { id: member.teamId },
    select: { name: true, sport: true },
  });
  if (!team) notFound();

  const sportMod = getSportModule(prismaSportToId(team.sport));
  const matchMod = sportMod.match;

  const now = new Date();

  const [members, events, matchEvents] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: member.teamId, status: MemberStatus.ACTIVE },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.event.findMany({
      where: {
        teamId: member.teamId,
        status: EventStatus.PUBLISHED,
        endsAt: { lte: now },
      },
      select: {
        id: true,
        endsAt: true,
        participants: { select: { memberId: true } },
        attendance: { select: { memberId: true, checkedIn: true } },
        feedback: {
          select: {
            memberId: true,
            rpe: true,
            fatigue: true,
            painLevel: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { endsAt: "desc" },
      take: 500,
    }),
    prisma.event.findMany({
      where: {
        teamId: member.teamId,
        status: EventStatus.PUBLISHED,
        endsAt: { lte: now },
        type: "MATCH",
      },
      select: {
        id: true,
        title: true,
        endsAt: true,
        matchResult: {
          select: {
            playerStats: {
              select: {
                memberId: true,
                stats: true,
                member: { select: { user: { select: { name: true, email: true } }, jerseyNumber: true, squad: true } },
              },
            },
          },
        },
      },
      orderBy: { endsAt: "desc" },
      take: 200,
    }),
  ]);

  const memberMeta = new Map(
    members.map((m) => [
      m.id,
      {
        displayName: m.user.name ?? m.user.email ?? m.id.slice(0, 8),
        squad: m.squad,
        jerseyNumber: m.jerseyNumber,
        position: m.position,
      },
    ]),
  );

  const tally = new Map<
    string,
    {
      eligible: number;
      attended: number;
      rpes: number[];
      fatigueIdx: number[];
      painIdx: number[];
      feedbackCount: number;
      mostRecentFeedbackAt: Date | null;
    }
  >();
  for (const m of members) {
    tally.set(m.id, {
      eligible: 0,
      attended: 0,
      rpes: [],
      fatigueIdx: [],
      painIdx: [],
      feedbackCount: 0,
      mostRecentFeedbackAt: null,
    });
  }

  for (const ev of events) {
    const participantIds = new Set(ev.participants.map((p) => p.memberId));
    const checkedInIds = new Set(ev.attendance.filter((a) => a.checkedIn).map((a) => a.memberId));

    for (const memberId of participantIds) {
      const t = tally.get(memberId);
      if (!t) continue;
      t.eligible += 1;
      if (checkedInIds.has(memberId)) t.attended += 1;
    }

    for (const fb of ev.feedback) {
      const t = tally.get(fb.memberId);
      if (!t) continue;
      t.feedbackCount += 1;
      t.rpes.push(fb.rpe);
      t.fatigueIdx.push(fatigueLevelIndex(fb.fatigue));
      t.painIdx.push(painLevelIndex(fb.painLevel));
      if (!t.mostRecentFeedbackAt || fb.submittedAt.getTime() > t.mostRecentFeedbackAt.getTime()) {
        t.mostRecentFeedbackAt = fb.submittedAt;
      }
    }
  }

  const rows: MemberRow[] = members.map((m) => {
    const meta = memberMeta.get(m.id);
    const t = tally.get(m.id);
    const eligible = t?.eligible ?? 0;
    const attended = t?.attended ?? 0;
    return {
      memberId: m.id,
      displayName: meta?.displayName ?? m.id.slice(0, 8),
      squad: meta?.squad ?? null,
      jerseyNumber: meta?.jerseyNumber ?? null,
      eligibleEvents: eligible,
      attendedEvents: attended,
      attendanceRatePct: pct(attended, eligible),
      feedbackCount: t?.feedbackCount ?? 0,
      avgRpe: avg(t?.rpes ?? []),
      avgFatigueIndex: avg(t?.fatigueIdx ?? []),
      avgPainIndex: avg(t?.painIdx ?? []),
      mostRecentFeedbackAt: t?.mostRecentFeedbackAt ?? null,
    };
  });

  const totalEndedPublishedEvents = events.length;
  const totalEndedPublishedMatches = matchEvents.length;

  const byAttendance = [...rows].sort((a, b) => (b.attendanceRatePct ?? -1) - (a.attendanceRatePct ?? -1));
  const attendanceTop = topN(byAttendance.filter((r) => r.attendanceRatePct != null), 1)[0];

  const matchTotalRows =
    sportMod.capabilities.matchStats && matchMod ?
      buildMatchTotals(members, matchEvents, matchMod)
    : [];

  const matchStandoutCards =
    matchMod && matchTotalRows.length > 0 ?
      computeStandoutWinners(matchMod.standoutLeaders, matchTotalRows)
    : [];

  const quickRows: QuickIndicatorRow[] =
    matchMod ?
      matchTotalRows.map((r) => ({
        memberId: r.memberId,
        displayName: r.displayName,
        jerseyNumber: r.jerseyNumber,
        squad: r.squad,
        position: r.position,
        matchCount: r.matchCount,
        stats: r.stats,
        ratings: Object.fromEntries(matchMod.ratings.map((def) => [def.key, def.compute(r.stats)])),
        overall: matchMod.computeOverallIndicator(r.stats),
      }))
    : [];

  const tableRows: MemberStatsTableRow[] = rows.map((r) => {
    const fatigueAvgLabel =
      r.avgFatigueIndex == null ? "—"
      : r.avgFatigueIndex < 0.5 ? fatigueLabel("LOW")
      : r.avgFatigueIndex < 1.5 ? fatigueLabel("MED")
      : fatigueLabel("HIGH");
    const painAvgLabel =
      r.avgPainIndex == null ? "—"
      : r.avgPainIndex < 0.5 ? painLabel("NONE")
      : r.avgPainIndex < 1.5 ? painLabel("MILD")
      : painLabel("SEVERE");

    return {
      memberId: r.memberId,
      displayName: r.displayName,
      squad: r.squad,
      jerseyNumber: r.jerseyNumber,
      eligibleEvents: r.eligibleEvents,
      attendedEvents: r.attendedEvents,
      attendanceRatePct: r.attendanceRatePct,
      feedbackCount: r.feedbackCount,
      avgRpe: r.avgRpe,
      avgFatigueLabel: fatigueAvgLabel,
      avgPainLabel: painAvgLabel,
      mostRecentFeedbackAtLabel:
        r.mostRecentFeedbackAt ?
          formatDateTimeZh(r.mostRecentFeedbackAt, { dateStyle: "medium", timeStyle: "short" })
        : "—",
      mostRecentFeedbackAtMs: r.mostRecentFeedbackAt ? r.mostRecentFeedbackAt.getTime() : null,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/coach/team" className="text-sm text-blue-600 hover:underline">
          ← 隊伍／隊員
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight">隊伍統計</h1>
          <HintExclamationToggle>
            第一版統計以<strong className="font-medium">已發布且已結束</strong>事件為樣本；出席＝checkedIn；回饋＝球員提交的身體回饋。
          </HintExclamationToggle>
        </div>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {team.name} · 近 {totalEndedPublishedEvents} 場已結束事件（最多 500 場）
        </p>
      </div>

      <CoachEventDetailCollapsibleSection
        id="coach-team-stats-standout"
        title="表現突出者"
        defaultOpen={true}
        titleExtra={
          <HintExclamationToggle>
            榜單用途是快速掃描（註解：並非評分）；比賽榜單依累計個人數據計算，樣本不足時請搭配下方總表一起看。
          </HintExclamationToggle>
        }
      >
        <MatchStandoutCards
          attendanceCard={
            attendanceTop ?
              {
                key: "attendance",
                title: "出席王",
                subtitle: "出席率最高",
                displayName: attendanceTop.displayName,
                jerseyNumber: attendanceTop.jerseyNumber,
                formattedValue: `${attendanceTop.attendanceRatePct?.toFixed(1)}%`,
                detail: `${attendanceTop.attendedEvents} / ${attendanceTop.eligibleEvents} 場`,
              }
            : { key: "attendance", title: "出席王", subtitle: "出席率最高", empty: true }
          }
          matchCards={matchStandoutCards}
          matchSampleNote={
            sportMod.capabilities.matchStats && matchMod && matchTotalRows.length > 0 ?
              `比賽榜單依近 ${totalEndedPublishedMatches} 場已結束比賽之累計個人數據計算（最多 200 場）。`
            : sportMod.capabilities.matchStats && matchMod ?
              "尚無比賽個人數據，僅顯示出席榜單。"
            : undefined
          }
        />
      </CoachEventDetailCollapsibleSection>

      <CoachEventDetailCollapsibleSection
        id="coach-team-stats-table"
        title="球員總表（出席＋回饋）"
        defaultOpen={false}
        titleExtra={
          <HintExclamationToggle>
            疲勞／疼痛的「平均」以 0–2 做數值平均後再轉回文字（註解：低/中/高、無/輕微/明顯），用於快速掃描。
          </HintExclamationToggle>
        }
      >
        <MemberStatsTable rows={tableRows} />
      </CoachEventDetailCollapsibleSection>

      <CoachEventDetailCollapsibleSection id="coach-team-stats-next" title="下一步（比賽個人數據）" defaultOpen={false}>
        {!sportMod.capabilities.matchStats || !matchMod ?
          <SportFeatureComingSoon sport={prismaSportToId(team.sport)} featureLabel="比賽個人數據累計" />
        : (
            <div className="space-y-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                已結束且已發布的 MATCH 事件：{totalEndedPublishedMatches} 場（最多 200 場）。以下僅統計「有填寫個人數據」之球員與場次。
              </p>

              <MatchQuickIndicators rows={quickRows} defaultSortKey="overall" />

              <CoachEventDetailCollapsibleSection
                id="coach-team-match-stats-totals"
                title="個人數據（累計總表）"
                defaultOpen={false}
                titleExtra={
                  <HintExclamationToggle>
                    這裡顯示「累計後」的分類表格；若要看單場資料，請到各事件頁的「比賽結果」。
                  </HintExclamationToggle>
                }
              >
                <MatchStatsTotalsToggle
                  rows={matchTotalRows.map((r) => ({
                    memberId: r.memberId,
                    displayName: r.displayName,
                    stats: r.stats,
                    matchCount: r.matchCount,
                  }))}
                />
              </CoachEventDetailCollapsibleSection>
            </div>
          )}
      </CoachEventDetailCollapsibleSection>
    </div>
  );
}

