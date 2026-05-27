import {
  addDays,
  endOfMonthExclusive,
  parseYmd,
  startOfWeekMonday,
  toYmd,
} from "@/app/coach/(main)/calendar/calendar-utils";
import {
  PlayerScheduleMonthGrid,
  PlayerScheduleWeekGrid,
  PlayerScheduleWeekGridDesktop,
  type PlayerScheduleCalendarEvent,
} from "@/app/player/(main)/player-schedule-views";
import { PlayerScheduleToolbar } from "@/app/player/(main)/player-schedule-toolbar";
import { parsePlayerScheduleView } from "@/app/player/(main)/player-schedule-view";
import {
  InsetGroupedEmpty,
  InsetGroupedList,
  InsetGroupedRow,
  InsetGroupedSection,
} from "@/components/ui/inset-grouped-list";
import { getTeamMember } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { EventStatus, EventType } from "@/generated/prisma/client";
import { formatDateTimeZh, formatDateZh } from "@/lib/format-datetime";
import { EventTitleInlineMeta } from "@/components/event-title-with-meta";
import { isEventEnded } from "@/lib/event-timing";

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

type EventRow = {
  id: string;
  title: string;
  type: EventType;
  startsAt: Date;
  endsAt: Date;
  locationName: string | null;
  rsvpDeadlineAt: Date | null;
  attendance: { rsvpStatus: string }[];
};

/** 單列行程（註解：已結束者時間地點簡寫併入標題）。 */
function EventListItem({ ev }: { ev: EventRow }) {
  const att = ev.attendance[0];
  const rsvp = att?.rsvpStatus ?? "UNANSWERED";
  const now = new Date();
  const ended = isEventEnded(ev.endsAt, now);
  const deadlinePassed =
    ev.rsvpDeadlineAt != null && now.getTime() > ev.rsvpDeadlineAt.getTime();
  const needRsvp = !ended && rsvp === "UNANSWERED" && !deadlinePassed;

  const subtitle =
    ended ?
      typeLabel(ev.type)
    : (
      <>
        {typeLabel(ev.type)} ·{" "}
        {formatDateTimeZh(ev.startsAt, {
          weekday: "short",
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {ev.locationName ? ` · ${ev.locationName}` : ""}
      </>
    );

  return (
    <InsetGroupedRow
      href={`/player/events/${ev.id}`}
      title={
        <EventTitleInlineMeta
          title={ev.title}
          startsAt={ev.startsAt}
          endsAt={ev.endsAt}
          locationName={ev.locationName}
          ended={ended}
          titleClassName="font-medium text-zinc-900 dark:text-zinc-50"
          metaClassName="text-xs font-normal text-zinc-500 dark:text-zinc-400"
        />
      }
      subtitle={subtitle}
      badge={
        needRsvp ?
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
            待回覆
          </span>
        : undefined
      }
    />
  );
}

type PageProps = {
  searchParams: Promise<{ view?: string; date?: string }>;
};

/** 我的行程：列表（今日起／歷史）或週／月視圖（註解：均限已發布且為參與者）。 */
export default async function PlayerSchedulePage({ searchParams }: PageProps) {
  const member = await getTeamMember();
  if (!member) return null;

  const sp = await searchParams;
  const view = parsePlayerScheduleView(sp.view);
  const anchor = parseYmd(sp.date);
  const dateYmd = toYmd(anchor);

  const prisma = getPrisma();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const baseWhere = {
    teamId: member.teamId,
    status: EventStatus.PUBLISHED,
    participants: { some: { memberId: member.id } },
  };

  const attendanceInclude = {
    attendance: {
      where: { memberId: member.id },
      take: 1,
    },
  };

  const weekStart = startOfWeekMonday(anchor);
  const weekEndExcl = addDays(weekStart, 7);
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 0, 0, 0, 0);
  const monthEndExcl = endOfMonthExclusive(anchor);

  const rangeStart = view === "month" ? monthStart : weekStart;
  const rangeEndExcl = view === "month" ? monthEndExcl : weekEndExcl;

  const weekLabel = `${formatDateZh(weekStart, { month: "numeric", day: "numeric" })} — ${formatDateZh(addDays(weekStart, 6), { month: "numeric", day: "numeric", year: "numeric" })}`;
  const monthLabel = formatDateZh(anchor, { year: "numeric", month: "long" });

  const [upcoming, past, rangeRaw] = await Promise.all([
    view === "list" ?
      prisma.event.findMany({
        where: {
          ...baseWhere,
          endsAt: { gte: startOfToday },
        },
        orderBy: { startsAt: "asc" },
        take: 80,
        include: attendanceInclude,
      })
    : Promise.resolve([]),
    view === "list" ?
      prisma.event.findMany({
        where: {
          ...baseWhere,
          endsAt: { lt: startOfToday },
        },
        orderBy: { startsAt: "desc" },
        take: 80,
        include: attendanceInclude,
      })
    : Promise.resolve([]),
    view === "week" || view === "month" ?
      prisma.event.findMany({
        where: {
          ...baseWhere,
          startsAt: {
            gte: rangeStart,
            lt: rangeEndExcl,
          },
        },
        orderBy: { startsAt: "asc" },
        take: view === "month" ? 500 : 200,
        include: attendanceInclude,
      })
    : Promise.resolve([]),
  ]);

  const calendarEvents: PlayerScheduleCalendarEvent[] = rangeRaw.map((ev) => ({
    id: ev.id,
    title: ev.title,
    type: ev.type,
    startsAt: ev.startsAt,
    endsAt: ev.endsAt,
    rsvpDeadlineAt: ev.rsvpDeadlineAt,
    attendance: ev.attendance,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">我的行程</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          僅顯示已發布、且你有被列入參與者的場次（含今日起與更早）
        </p>
      </div>

      <PlayerScheduleToolbar
        view={view}
        dateYmd={dateYmd}
        weekLabel={weekLabel}
        monthLabel={monthLabel}
      />

      {view === "month" ?
        <PlayerScheduleMonthGrid monthAnchor={anchor} events={calendarEvents} />
      : view === "week" ?
        <>
          <PlayerScheduleWeekGrid weekStart={weekStart} events={calendarEvents} />
          <PlayerScheduleWeekGridDesktop weekStart={weekStart} events={calendarEvents} />
        </>
      : (
        <>
          <InsetGroupedList>
            <InsetGroupedSection header="即將到來">
              {upcoming.length === 0 ?
                <InsetGroupedEmpty>目前沒有即將到來的行程</InsetGroupedEmpty>
              : upcoming.map((ev) => <EventListItem key={ev.id} ev={ev} />)}
            </InsetGroupedSection>

            <InsetGroupedSection header="更早的行程">
              {past.length === 0 ?
                <InsetGroupedEmpty>尚無更早的紀錄</InsetGroupedEmpty>
              : past.map((ev) => <EventListItem key={ev.id} ev={ev} />)}
            </InsetGroupedSection>
          </InsetGroupedList>
        </>
      )}
    </div>
  );
}
