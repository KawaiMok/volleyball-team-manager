import { CoachEventsPageView } from "@/app/coach/(main)/events/coach-events-page-view";
import type { CoachEventTypeKey } from "@/app/coach/(main)/events/coach-events-list-types";
import {
  buildCoachEventsListQuery,
  CoachEventsMonthPanel,
} from "@/app/coach/(main)/events/coach-events-month-panel";
import type { CalendarEventRow } from "@/app/coach/(main)/calendar/calendar-views";
import {
  buildCoachEventsListWhere,
  coachEventsFiltersToFormValues,
  hasActiveCoachEventsFilters,
  parseCoachEventsListFilters,
} from "@/app/coach/(main)/events/events-list-params";
import { endOfMonthExclusive, parseYmd, toYmd } from "@/app/coach/(main)/calendar/calendar-utils";
import type { EventStatusKey } from "@/components/domain-status-indicators";
import { parseGroupConfig } from "@/lib/group-config";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";

type PageProps = {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
    etype?: string | string[];
    estatus?: string | string[];
    squad?: string;
    cal?: string;
  }>;
};

const LIST_TAKE = 500;

/** 事件列表：左側 logo 入口 + 右側月曆（註解：列表／篩選在 BottomSheet）。 */
export default async function CoachEventsPage({ searchParams }: PageProps) {
  const member = await getDebugTeamMember();
  if (!member) return null;

  const sp = await searchParams;
  const parsed = parseCoachEventsListFilters(sp);
  const where = buildCoachEventsListWhere(parsed, member.teamId);
  const filterActive = hasActiveCoachEventsFilters(parsed);
  const monthAnchor = parseYmd(sp.cal);
  const listQuery = buildCoachEventsListQuery({ ...sp, cal: sp.cal ?? toYmd(monthAnchor) });
  const monthStart = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1, 0, 0, 0, 0);
  const monthEndExcl = endOfMonthExclusive(monthAnchor);

  const prisma = getPrisma();
  const [events, monthEvents, team] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startsAt: "desc" },
      include: {
        _count: { select: { participants: true } },
      },
      take: LIST_TAKE,
    }),
    prisma.event.findMany({
      where: {
        teamId: member.teamId,
        startsAt: { gte: monthStart, lt: monthEndExcl },
      },
      orderBy: { startsAt: "asc" },
      take: 500,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        startsAt: true,
        endsAt: true,
      },
    }),
    prisma.team.findUnique({
      where: { id: member.teamId },
      select: { groupConfig: true },
    }),
  ]);

  const squads = parseGroupConfig(team?.groupConfig ?? null);
  const formValues = coachEventsFiltersToFormValues(parsed);
  const calendarEvents: CalendarEventRow[] = monthEvents;

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">事件</h1>
          {filterActive ?
            <span className="rounded-md bg-sky-100 px-2 py-0.5 text-xs font-medium text-blue-900 dark:bg-sky-950/50 dark:text-blue-200">
              已套用篩選
            </span>
          : null}
          <HintExclamationToggle>
            左側為快捷入口；右側為事件月曆。列表與篩選請點「全部列表／搜尋篩選」。
          </HintExclamationToggle>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">事件管理 · {toYmd(monthAnchor).slice(0, 7)} 月曆</p>
      </div>

      <CoachEventsPageView
        events={events.map((ev) => ({
          id: ev.id,
          title: ev.title,
          type: ev.type as CoachEventTypeKey,
          status: ev.status as EventStatusKey,
          startsAt: ev.startsAt.toISOString(),
          endsAt: ev.endsAt.toISOString(),
          locationName: ev.locationName,
        }))}
        filterValues={{
          ...formValues,
          types: formValues.types as CoachEventTypeKey[],
          statuses: formValues.statuses as EventStatusKey[],
        }}
        squads={squads}
        filterActive={filterActive}
        listTake={LIST_TAKE}
        emptyMessage={
          filterActive ? "沒有符合條件的事件，請調整篩選或重設" : "尚無事件，請新增一場訓練或比賽"
        }
        calYmd={toYmd(monthAnchor)}
        calendar={
          <CoachEventsMonthPanel
            monthAnchor={monthAnchor}
            events={calendarEvents}
            listQuery={listQuery}
          />
        }
      />
    </div>
  );
}
