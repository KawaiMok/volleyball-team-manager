"use client";

import { CoachDashboardHub } from "@/app/coach/(main)/coach-dashboard-hub";
import { CoachDashboardRpeChart } from "@/app/coach/(main)/coach-dashboard-rpe-chart";
import { CoachDashboardFitnessAnalysisSection } from "@/app/coach/(main)/coach-dashboard-fitness-analysis-section";
import { CoachDashboardFitnessTrainingSection } from "@/app/coach/(main)/coach-dashboard-fitness-training-section";
import {
  CoachDashboardRosterSection,
  type DashboardRosterMember,
} from "@/app/coach/(main)/coach-dashboard-roster-section";
import type { TeamFitnessTrainingAdvice } from "@/lib/team-fitness-ai-schema";
import {
  DashboardEventListItem,
  DashboardSectionHeader,
  DashboardStatTile,
} from "@/app/coach/(main)/coach-dashboard-ui";
import {
  CoachTodayTrainingLoadSection,
  type TodayTrainingEventBrief,
} from "@/app/coach/(main)/today-training-load";
import { EventStatusIndicator, type EventStatusKey } from "@/components/domain-status-indicators";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import type { DailyRpePoint } from "@/lib/coach-dashboard-rpe-series";
import type { DashboardEventTypeKey } from "@/app/coach/(main)/coach-dashboard-ui";
import type { CoachDashboardWidgetId } from "@/app/coach/(main)/coach-dashboard-prefs";

type UpcomingEvent = {
  id: string;
  title: string;
  type: DashboardEventTypeKey;
  status: EventStatusKey;
  startsAtLabel: string;
};

type RecentEvent = {
  id: string;
  title: string;
  type: DashboardEventTypeKey;
  startsAtLabel: string;
};

type Props = {
  draftCount: number;
  upcoming: UpcomingEvent[];
  recentEvents: RecentEvent[];
  rosterMembers: DashboardRosterMember[];
  teamFitnessTrainingAdvice: TeamFitnessTrainingAdvice | null;
  needsRsvpFollowUp: UpcomingEvent[];
  unansweredByEvent: Record<string, number>;
  participantsByEvent: Record<string, number>;
  todayTrainingEvents: TodayTrainingEventBrief[];
  feedbackCount: number;
  avgRpeToday: number | null;
  fatigueAgg: { LOW: number; MED: number; HIGH: number };
  painAgg: { NONE: number; MILD: number; SEVERE: number };
  rpeSeries: DailyRpePoint[];
  showLiveTactical?: boolean;
};

/** 教練總覽客戶端：服務入口 + BottomSheet 內容（註解：首屏只顯示入口網格）。 */
export function CoachDashboardView({
  draftCount,
  upcoming,
  recentEvents,
  rosterMembers,
  teamFitnessTrainingAdvice,
  needsRsvpFollowUp,
  unansweredByEvent,
  participantsByEvent,
  todayTrainingEvents,
  feedbackCount,
  avgRpeToday,
  fatigueAgg,
  painAgg,
  rpeSeries,
  showLiveTactical = false,
}: Props) {
  const totalUnansweredSlots = needsRsvpFollowUp.length;
  const hiddenWidgets: CoachDashboardWidgetId[] = showLiveTactical ? [] : ["liveTactical"];
  const hasFitnessAnalysis = rosterMembers.some((m) => m.fitnessAnalysis != null);

  return (
    <CoachDashboardHub
      hiddenWidgets={hiddenWidgets}
      badges={{
        rsvp: totalUnansweredSlots,
        upcoming: upcoming.length,
        recentEvents: recentEvents.length,
        roster: rosterMembers.length,
      }}
      sections={{
        stats: (
          <div className="grid gap-3 sm:grid-cols-3">
            <DashboardStatTile
              label="草稿事件"
              value={draftCount}
              href="/coach/events"
              hrefLabel="查看全部"
            />
            <DashboardStatTile label="未來 7 天場次" value={upcoming.length} />
            <DashboardStatTile
              label="待回覆出席意願"
              value={totalUnansweredSlots}
              emphasize={totalUnansweredSlots > 0}
            />
          </div>
        ),
        todayTraining: (
          <CoachTodayTrainingLoadSection
            trainings={todayTrainingEvents}
            feedbackCount={feedbackCount}
            avgRpe={avgRpeToday}
            fatigue={fatigueAgg}
            pain={painAgg}
          />
        ),
        upcoming: (
          <div>
            <DashboardSectionHeader title="未來 7 天" moreHref="/coach/events/new" moreLabel="新增事件" />
            {upcoming.length === 0 ?
              <p className="text-sm text-zinc-500 dark:text-zinc-400">尚未安排未來 7 天內事件</p>
            : (
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {upcoming.map((ev) => {
                  const u = unansweredByEvent[ev.id] ?? 0;
                  const total = participantsByEvent[ev.id] ?? 0;
                  const showRsvp = ev.status === "PUBLISHED" && total > 0;
                  return (
                    <li key={ev.id}>
                      <DashboardEventListItem
                        href={`/coach/events/${ev.id}`}
                        title={ev.title}
                        type={ev.type}
                        meta={ev.startsAtLabel}
                        badge={
                          showRsvp ?
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                              <EventStatusIndicator status={ev.status} />
                              {u === 0 ? "全員已回覆" : `未回覆 ${u}/${total}`}
                            </span>
                          : ev.status === "DRAFT" ?
                            <span className="text-[11px] text-zinc-500">草稿 · 發布後可回覆出席</span>
                          : <EventStatusIndicator status={ev.status} />
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ),
        recentEvents: (
          <div>
            <DashboardSectionHeader title="最近事件" moreHref="/coach/events" />
            {recentEvents.length === 0 ?
              <p className="text-sm text-zinc-500 dark:text-zinc-400">尚無已結束事件</p>
            : (
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {recentEvents.map((ev) => (
                  <li key={ev.id}>
                    <DashboardEventListItem
                      href={`/coach/events/${ev.id}`}
                      title={ev.title}
                      type={ev.type}
                      meta={ev.startsAtLabel}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        ),
        roster: (
          <div>
            <DashboardSectionHeader
              title="隊員名單"
              moreHref="/coach/team"
              moreLabel="管理隊員"
              hint={
                <HintExclamationToggle>
                  點選隊員列查看體能、比賽與 AI 體能分析評語；全隊分析請用「體能分析」入口。
                </HintExclamationToggle>
              }
            />
            <CoachDashboardRosterSection members={rosterMembers} />
          </div>
        ),
        fitnessAnalysis: (
          <CoachDashboardFitnessAnalysisSection
            rows={rosterMembers.map((m) => ({
              memberId: m.memberId,
              displayName: m.displayName,
              jerseyNumber: m.jerseyNumber,
              analysis: m.fitnessAnalysis,
            }))}
          />
        ),
        fitnessTrainingAdvice: (
          <CoachDashboardFitnessTrainingSection
            advice={teamFitnessTrainingAdvice}
            hasAnalysis={hasFitnessAnalysis}
          />
        ),
        rsvp: (
          <div>
            <DashboardSectionHeader title="出席意願待追蹤" />
            {needsRsvpFollowUp.length === 0 ?
              <p className="text-sm text-zinc-500 dark:text-zinc-400">目前沒有待追蹤的場次。</p>
            : (
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                {needsRsvpFollowUp.map((ev) => {
                  const u = unansweredByEvent[ev.id] ?? 0;
                  const total = participantsByEvent[ev.id] ?? 0;
                  return (
                    <li key={ev.id}>
                      <DashboardEventListItem
                        href={`/coach/events/${ev.id}`}
                        title={ev.title}
                        type={ev.type}
                        meta={ev.startsAtLabel}
                        badge={
                          <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                            未回覆 {u}
                            {total > 0 ? ` / ${total}` : ""}
                          </span>
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ),
        trends: <CoachDashboardRpeChart points={rpeSeries} />,
      }}
    />
  );
}
