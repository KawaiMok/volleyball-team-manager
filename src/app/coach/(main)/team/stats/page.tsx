import Link from "next/link";
import { notFound } from "next/navigation";

import { CoachEventDetailCollapsibleSection } from "@/components/coach-event-detail-collapsible-section";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { getDebugTeamMember } from "@/lib/debug-session";
import { fatigueLabel, fatigueLevelIndex, painLabel, painLevelIndex } from "@/lib/feedback-display";
import { getPrisma } from "@/lib/prisma";
import { formatDateTimeZh } from "@/lib/format-datetime";
import { EventStatus, MemberStatus } from "@/generated/prisma/client";
import { MemberStatsTable, type MemberStatsTableRow } from "@/app/coach/(main)/team/stats/member-stats-table";
import {
  EMPTY_PLAYER_STATS,
  hasAnyPlayerStats,
  normalizePlayerStats,
  type PlayerMatchStats,
} from "@/lib/match-result-schema";
import {
  computeAttackRates,
  computeAttackRating,
  computeBlockRating,
  computeDefenseRate,
  computeDefenseRating,
  computePassRating,
  computeServeRating,
  computeOverallIndicator,
} from "@/lib/match-player-stats-metrics";
import { MatchStatsTotalsToggle } from "@/app/coach/(main)/team/stats/match-stats-totals-toggle";
import { MatchQuickIndicators, type QuickIndicatorRow } from "@/app/coach/(main)/team/stats/match-quick-indicators";

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

function addMatchStats(a: PlayerMatchStats, b: PlayerMatchStats): PlayerMatchStats {
  const out: PlayerMatchStats = {
    attack: { ...a.attack },
    block: { ...a.block },
    defense: { ...a.defense },
    pass: { ...a.pass },
    serve: { ...a.serve },
    other: { ...a.other },
  };
  (["attack", "block", "defense", "pass", "serve", "other"] as const).forEach((cat) => {
    const ca = out[cat];
    const cb = b[cat];
    if (!ca || !cb) return;
    for (const [k, v] of Object.entries(cb)) {
      if (typeof v !== "number") continue;
      (ca as Record<string, number>)[k] = ((ca as Record<string, number>)[k] ?? 0) + v;
    }
  });
  return out;
}

/** 教練端：隊伍統計（註解：第一版以「出席 + 回饋」為主，樣本＝已發布且已結束之事件）。 */
export default async function CoachTeamStatsPage() {
  const member = await getDebugTeamMember();
  if (!member) return null;

  const prisma = getPrisma();
  const team = await prisma.team.findUnique({
    where: { id: member.teamId },
    select: { name: true },
  });
  if (!team) notFound();

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

  const standout = {
    attendanceTop: topN(byAttendance.filter((r) => r.attendanceRatePct != null), 5),
  };

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
            榜單用途是快速掃描（註解：並非評分）；若樣本數不足（例如只參與 1 場），請搭配下方總表一起看。
          </HintExclamationToggle>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">出席率 Top</p>
            <ol className="mt-2 space-y-1 text-sm">
              {standout.attendanceTop.length === 0 ?
                <li className="text-zinc-500 dark:text-zinc-400">尚無可計算的出席率</li>
              : standout.attendanceTop.map((r) => (
                  <li key={r.memberId} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 truncate font-medium text-zinc-900 dark:text-zinc-50">
                      {r.displayName}
                      {r.jerseyNumber != null ? <span className="ml-1 text-xs text-zinc-500">#{r.jerseyNumber}</span> : null}
                    </span>
                    <span className="shrink-0 tabular-nums text-emerald-700 dark:text-emerald-300">
                      {r.attendanceRatePct?.toFixed(1)}%
                    </span>
                  </li>
                ))}
            </ol>
          </div>
          <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">註解</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              出席率分母＝「該員為參與者」且事件已結束、已發布之場次；分子＝教練點名 checkedIn。
            </p>
          </div>
        </div>
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
        {(() => {
          const totals = new Map<
            string,
            {
              memberId: string;
              displayName: string;
              jerseyNumber: number | null;
              squad: string | null;
              matchCount: number;
              stats: PlayerMatchStats;
            }
          >();

          for (const m of members) {
            totals.set(m.id, {
              memberId: m.id,
              displayName: m.user.name ?? m.user.email ?? m.id.slice(0, 8),
              jerseyNumber: m.jerseyNumber,
              squad: m.squad,
              matchCount: 0,
              stats: { ...EMPTY_PLAYER_STATS },
            });
          }

          for (const ev of matchEvents) {
            const ps = ev.matchResult?.playerStats ?? [];
            for (const row of ps) {
              const memberId = row.memberId;
              const normalized = normalizePlayerStats(row.stats);
              if (!hasAnyPlayerStats(normalized)) continue;
              const existing = totals.get(memberId);
              if (!existing) continue;
              existing.matchCount += 1;
              existing.stats = addMatchStats(existing.stats, normalized);
            }
          }

          const totalRows = Array.from(totals.values()).filter((r) => r.matchCount > 0);
          totalRows.sort((a, b) => b.matchCount - a.matchCount);

          const quickRows: QuickIndicatorRow[] = totalRows.map((r) => ({
            memberId: r.memberId,
            displayName: r.displayName,
            jerseyNumber: r.jerseyNumber,
            squad: r.squad,
            matchCount: r.matchCount,
            stats: r.stats,
            attackRating: computeAttackRating(r.stats),
            defenseRating: computeDefenseRating(r.stats),
            blockRating: computeBlockRating(r.stats),
            passRating: computePassRating(r.stats),
            serveRating: computeServeRating(r.stats),
            overall: computeOverallIndicator(r.stats),
          }));

          return (
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
                    這裡顯示「累計後」的六大分類表格；若要看單場資料，請到各事件頁的「比賽結果」。
                  </HintExclamationToggle>
                }
              >
                <MatchStatsTotalsToggle
                  rows={totalRows.map((r) => ({
                    memberId: r.memberId,
                    displayName: r.displayName,
                    stats: r.stats,
                    matchCount: r.matchCount,
                  }))}
                />
              </CoachEventDetailCollapsibleSection>
            </div>
          );
        })()}
      </CoachEventDetailCollapsibleSection>
    </div>
  );
}

