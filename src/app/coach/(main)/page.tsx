import Link from "next/link";

import { addDays } from "@/app/coach/(main)/calendar/calendar-utils";
import {
  CoachDashboardProvider,
  CoachDashboardSection,
  CoachDashboardSettingsPanel,
} from "@/app/coach/(main)/coach-dashboard-prefs";
import { CoachDashboardRpeChart } from "@/app/coach/(main)/coach-dashboard-rpe-chart";
import { CoachTodayTrainingLoadSection } from "@/app/coach/(main)/today-training-load";
import { getDebugTeamMember } from "@/lib/debug-session";
import { buildDailyRpeSeries } from "@/lib/coach-dashboard-rpe-series";
import { getPrisma } from "@/lib/prisma";
import { EventStatus, EventType, RsvpStatus } from "@/generated/prisma/client";

function typeLabel(t: EventType) {
  switch (t) {
    case EventType.TRAINING:
      return "訓練";
    case EventType.MATCH:
      return "比賽";
    default:
      return "其他";
  }
}

function statusLabel(s: EventStatus) {
  switch (s) {
    case EventStatus.DRAFT:
      return "草稿";
    case EventStatus.PUBLISHED:
      return "已發布";
    case EventStatus.CANCELLED:
      return "已取消";
    default:
      return s;
  }
}

/** 教練總覽：可配置區塊、近 30 天 RPE 趨勢（註解：對應規格 A1 Dashboard）。 */
export default async function CoachDashboardPage() {
  const member = await getDebugTeamMember();
  if (!member) return null;

  const prisma = getPrisma();
  const now = new Date();
  const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [upcoming, draftCount] = await Promise.all([
    prisma.event.findMany({
      where: {
        teamId: member.teamId,
        startsAt: { gte: now, lte: weekLater },
        status: { not: EventStatus.CANCELLED },
      },
      orderBy: { startsAt: "asc" },
      take: 24,
    }),
    prisma.event.count({
      where: { teamId: member.teamId, status: EventStatus.DRAFT },
    }),
  ]);

  const eventIds = upcoming.map((e) => e.id);

  const [unansweredGroups, participantCounts] =
    eventIds.length === 0 ?
      [[], []]
    : await Promise.all([
        prisma.attendance.groupBy({
          by: ["eventId"],
          where: {
            eventId: { in: eventIds },
            rsvpStatus: RsvpStatus.UNANSWERED,
          },
          _count: { _all: true },
        }),
        prisma.event.findMany({
          where: { id: { in: eventIds } },
          select: {
            id: true,
            _count: { select: { participants: true } },
          },
        }),
      ]);

  const unansweredByEvent = Object.fromEntries(
    unansweredGroups.map((g) => [g.eventId, g._count._all]),
  );
  const participantsByEvent = Object.fromEntries(
    participantCounts.map((e) => [e.id, e._count.participants]),
  );

  /** 已發布且至少一人未回覆的場次（註解：教練追蹤用）。 */
  const needsRsvpFollowUp = upcoming.filter(
    (ev) =>
      ev.status === EventStatus.PUBLISHED &&
      (unansweredByEvent[ev.id] ?? 0) > 0,
  );

  const totalUnansweredSlots = needsRsvpFollowUp.length;

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

  return (
    <CoachDashboardProvider>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">總覽</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              未來 7 天行程、RSVP 待追蹤與草稿狀態 ·{" "}
              <Link href="/coach/calendar" className="text-blue-600 hover:underline">
                行事曆
              </Link>
            </p>
          </div>
          <Link
            href="/coach/live-tactical"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-800"
          >
            即時戰術版
          </Link>
        </div>

        <CoachDashboardSettingsPanel />

        <CoachDashboardSection id="stats">
          <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">草稿事件</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{draftCount}</p>
          <Link href="/coach/events" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
            查看全部
          </Link>
        </div>
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">未來 7 天場次</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{upcoming.length}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
          <p className="text-sm text-amber-900/80">待 RSVP 場次</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-amber-950">{totalUnansweredSlots}</p>
          <p className="mt-1 text-xs text-amber-900/70">已發布且尚有球員未回覆</p>
        </div>
          </div>
        </CoachDashboardSection>

        <CoachDashboardSection id="todayTraining">
          <CoachTodayTrainingLoadSection
            trainings={todayTrainingEvents}
            feedbackCount={fbN}
            avgRpe={avgRpeToday}
            fatigue={fatigueAgg}
            pain={painAgg}
          />
        </CoachDashboardSection>

        <CoachDashboardSection id="rsvp">
          <section>
            <h2 className="mb-3 text-lg font-medium">RSVP 待追蹤</h2>
            {needsRsvpFollowUp.length > 0 ?
              <ul className="divide-y divide-amber-200 overflow-hidden rounded-lg border border-amber-200 bg-amber-50/50">
                {needsRsvpFollowUp.map((ev) => {
                  const u = unansweredByEvent[ev.id] ?? 0;
                  const total = participantsByEvent[ev.id] ?? 0;
                  return (
                    <li key={ev.id}>
                      <Link
                        href={`/coach/events/${ev.id}`}
                        className="flex flex-col gap-1 px-4 py-3 transition hover:bg-amber-100/60 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">{ev.title}</span>
                          <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">{typeLabel(ev.type)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-950">
                            未回覆 {u}
                            {total > 0 ? ` / ${total}` : ""}
                          </span>
                          <time className="text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                            {ev.startsAt.toLocaleString("zh-TW", {
                              month: "short",
                              day: "numeric",
                              weekday: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            : <p className="text-sm text-zinc-500 dark:text-zinc-400">目前無待追蹤場次（未來 7 天內已發布且尚有未回覆 RSVP 者會出現在此）。</p>}
          </section>
        </CoachDashboardSection>

        <CoachDashboardSection id="upcoming">
          <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">未來 7 天</h2>
          <Link href="/coach/events/new" className="text-sm text-blue-600 hover:underline">
            新增事件
          </Link>
        </div>
        <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {upcoming.length === 0 ?
            <li className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">尚未安排未來 7 天內事件</li>
          : upcoming.map((ev) => {
              const u = unansweredByEvent[ev.id] ?? 0;
              const total = participantsByEvent[ev.id] ?? 0;
              const showRsvp =
                ev.status === EventStatus.PUBLISHED && total > 0;
              return (
                <li key={ev.id}>
                  <Link
                    href={`/coach/events/${ev.id}`}
                    className="flex flex-col gap-2 px-4 py-3 transition hover:bg-zinc-50 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-medium text-zinc-900 dark:text-zinc-50">{ev.title}</span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                          {typeLabel(ev.type)} · {statusLabel(ev.status)}
                        </span>
                      </div>
                      {showRsvp ?
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                          RSVP：{u === 0 ? "全員已回覆" : `未回覆 ${u} 人`}
                          {total > 0 ? `（共 ${total} 位參與者）` : ""}
                        </p>
                      : ev.status === EventStatus.DRAFT ?
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">發布後球員才可 RSVP</p>
                      : null}
                    </div>
                    <time className="shrink-0 text-sm tabular-nums text-zinc-600 dark:text-zinc-400">
                      {ev.startsAt.toLocaleString("zh-TW", {
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </Link>
                </li>
              );
            })
          }
        </ul>
          </section>
        </CoachDashboardSection>

        <CoachDashboardSection id="trends">
          <CoachDashboardRpeChart points={rpeSeries} />
        </CoachDashboardSection>
      </div>
    </CoachDashboardProvider>
  );
}
