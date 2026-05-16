import Link from "next/link";

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
import { getTeamMember } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { EventStatus, EventType } from "@/generated/prisma/client";

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
  locationName: string | null;
  rsvpDeadlineAt: Date | null;
  attendance: { rsvpStatus: string }[];
};

/** 單列行程連結（註解：即將到來與歷史共用；逾 RSVP 截止仍「未回覆」者不標「待 RSVP」）。 */
function EventListItem({ ev }: { ev: EventRow }) {
  const att = ev.attendance[0];
  const rsvp = att?.rsvpStatus ?? "UNANSWERED";
  const now = new Date();
  const deadlinePassed =
    ev.rsvpDeadlineAt != null && now.getTime() > ev.rsvpDeadlineAt.getTime();
  const needRsvp = rsvp === "UNANSWERED" && !deadlinePassed;
  return (
    <li>
      <Link
        href={`/player/events/${ev.id}`}
        className="flex flex-col gap-1 px-4 py-4 transition hover:bg-slate-50 dark:bg-slate-950"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-slate-900 dark:text-slate-50">{ev.title}</span>
          {needRsvp ?
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
              待 RSVP
            </span>
          : null}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {typeLabel(ev.type)} ·{" "}
          {ev.startsAt.toLocaleString("zh-TW", {
            weekday: "short",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {ev.locationName ? <span className="text-xs text-slate-500 dark:text-slate-400">{ev.locationName}</span> : null}
      </Link>
    </li>
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

  const weekLabel = `${weekStart.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })} — ${addDays(weekStart, 6).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric", year: "numeric" })}`;
  const monthLabel = anchor.toLocaleDateString("zh-TW", { year: "numeric", month: "long" });

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
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">今日起</h2>
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 shadow-sm">
              {upcoming.length === 0 ?
                <li className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">目前沒有即將到來的行程</li>
              : upcoming.map((ev) => <EventListItem key={ev.id} ev={ev} />)}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">更早的行程</h2>
            <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 shadow-sm">
              {past.length === 0 ?
                <li className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400">尚無更早的紀錄</li>
              : past.map((ev) => <EventListItem key={ev.id} ev={ev} />)}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
