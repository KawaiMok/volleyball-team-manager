import Link from "next/link";

import {
  addDays,
  startOfDay,
  startOfMonth,
  startOfWeekMonday,
  toYmd,
} from "@/app/coach/(main)/calendar/calendar-utils";
import { EventType } from "@/generated/prisma/client";
import { formatDateZh, formatTimeZh } from "@/lib/format-datetime";

export type PlayerScheduleCalendarEvent = {
  id: string;
  title: string;
  type: EventType;
  startsAt: Date;
  endsAt: Date;
  rsvpDeadlineAt: Date | null;
  attendance: { rsvpStatus: string }[];
};

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

function needRsvp(ev: PlayerScheduleCalendarEvent, now: Date) {
  const att = ev.attendance[0];
  const rsvp = att?.rsvpStatus ?? "UNANSWERED";
  const deadlinePassed =
    ev.rsvpDeadlineAt != null && now.getTime() > ev.rsvpDeadlineAt.getTime();
  return rsvp === "UNANSWERED" && !deadlinePassed;
}

function cardClass() {
  return "border-sky-200 bg-sky-50 text-sky-950 hover:bg-sky-100/90";
}

/** 週視圖（手機）：七日起註解：與教練週視圖相同分桶邏輯。 */
export function PlayerScheduleWeekGrid({
  weekStart,
  events,
}: {
  weekStart: Date;
  events: PlayerScheduleCalendarEvent[];
}) {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = new Map<string, PlayerScheduleCalendarEvent[]>();
  for (const ev of events) {
    const key = toYmd(startOfDay(ev.startsAt));
    const list = byDay.get(key) ?? [];
    list.push(ev);
    byDay.set(key, list);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  return (
    <div className="space-y-3 md:hidden">
      {days.map((d) => {
        const key = toYmd(d);
        const dayEvents = byDay.get(key) ?? [];
        return (
          <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 p-3 shadow-sm">
            <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {formatDateZh(d, { weekday: "long", month: "numeric", day: "numeric" })}
            </div>
            {dayEvents.length === 0 ?
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">無行程</p>
            : (
              <ul className="mt-2 space-y-2">
                {dayEvents.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={`/player/events/${ev.id}`}
                      className={`block rounded-lg border px-2 py-1.5 text-sm ${cardClass()}`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="font-medium">{ev.title}</span>
                        {needRsvp(ev, now) ?
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-900">
                            待 RSVP
                          </span>
                        : null}
                      </span>
                      <span className="mt-0.5 block text-xs opacity-90">
                        {formatTimeZh(ev.startsAt, { hour: "2-digit", minute: "2-digit" })} ·{" "}
                        {typeLabel(ev.type)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 週視圖（桌面）：七欄。 */
export function PlayerScheduleWeekGridDesktop({
  weekStart,
  events,
}: {
  weekStart: Date;
  events: PlayerScheduleCalendarEvent[];
}) {
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = new Map<string, PlayerScheduleCalendarEvent[]>();
  for (const ev of events) {
    const key = toYmd(startOfDay(ev.startsAt));
    const list = byDay.get(key) ?? [];
    list.push(ev);
    byDay.set(key, list);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  return (
    <div className="hidden overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-200 shadow-sm md:grid md:grid-cols-7 md:gap-px">
      {days.map((d) => {
        const key = toYmd(d);
        const dayEvents = byDay.get(key) ?? [];
        return (
          <div key={key} className="flex min-h-[14rem] flex-col bg-white dark:bg-zinc-900">
            <div className="border-b border-slate-100 px-2 py-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formatDateZh(d, { weekday: "short" })}
              <div className="text-sm tabular-nums text-slate-900 dark:text-slate-50">{d.getDate()}</div>
            </div>
            <div className="flex flex-1 flex-col gap-1 p-1.5">
              {dayEvents.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/player/events/${ev.id}`}
                  className={`rounded-md border px-1.5 py-1 text-xs leading-snug ${cardClass()}`}
                >
                  <span className="line-clamp-2 font-medium">{ev.title}</span>
                  <span className="mt-0.5 flex items-center justify-between gap-1 tabular-nums opacity-90">
                    {formatTimeZh(ev.startsAt, { hour: "2-digit", minute: "2-digit" })}
                    {needRsvp(ev, now) ?
                      <span className="rounded bg-amber-100 px-1 text-[9px] text-amber-900">RSVP</span>
                    : null}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** 月視圖：六週網格（註解：週一起算；非本月日期淡化）。 */
export function PlayerScheduleMonthGrid({
  monthAnchor,
  events,
}: {
  monthAnchor: Date;
  events: PlayerScheduleCalendarEvent[];
}) {
  const now = new Date();
  const monthStart = startOfMonth(monthAnchor);
  const gridStart = startOfWeekMonday(monthStart);
  const daysInGrid = 42;
  const cells = Array.from({ length: daysInGrid }, (_, i) => addDays(gridStart, i));

  const byDay = new Map<string, PlayerScheduleCalendarEvent[]>();
  for (const ev of events) {
    const key = toYmd(startOfDay(ev.startsAt));
    const list = byDay.get(key) ?? [];
    list.push(ev);
    byDay.set(key, list);
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }

  const weekDayLabels = ["一", "二", "三", "四", "五", "六", "日"];

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="grid min-w-[640px] grid-cols-7 gap-px bg-slate-200">
        {weekDayLabels.map((w) => (
          <div key={w} className="bg-slate-50 dark:bg-slate-950 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">
            週{w}
          </div>
        ))}
        {cells.map((d) => {
          const key = toYmd(d);
          const inMonth = d.getMonth() === monthAnchor.getMonth();
          const dayEvents = byDay.get(key) ?? [];
          return (
            <div
              key={key}
              className={`min-h-[6.5rem] bg-white dark:bg-zinc-900 p-1 ${inMonth ? "" : "bg-slate-50 dark:bg-slate-950/90 text-slate-400"}`}
            >
              <div className={`text-xs font-medium tabular-nums ${inMonth ? "text-slate-900 dark:text-slate-50" : "text-slate-400"}`}>
                {d.getDate()}
              </div>
              <ul className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={`/player/events/${ev.id}`}
                      className={`block truncate rounded px-0.5 py-0.5 text-[10px] leading-tight sm:text-xs ${cardClass()}`}
                      title={
                        needRsvp(ev, now) ? `${ev.title}（待 RSVP）` : ev.title
                      }
                    >
                      {formatTimeZh(ev.startsAt, { hour: "2-digit", minute: "2-digit" })}{" "}
                      {ev.title}
                    </Link>
                  </li>
                ))}
                {dayEvents.length > 3 ?
                  <li className="text-[10px] text-slate-500 dark:text-slate-400">+{dayEvents.length - 3} 場</li>
                : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
