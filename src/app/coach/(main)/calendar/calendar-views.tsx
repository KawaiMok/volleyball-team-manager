import Link from "next/link";

import { addDays, startOfDay, startOfMonth, startOfWeekMonday, toYmd } from "@/app/coach/(main)/calendar/calendar-utils";
import { EventStatus, EventType } from "@/generated/prisma/client";

export type CalendarEventRow = {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  startsAt: Date;
  endsAt: Date;
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

function statusShort(s: EventStatus) {
  switch (s) {
    case EventStatus.DRAFT:
      return "草稿";
    case EventStatus.PUBLISHED:
      return "已發布";
    case EventStatus.CANCELLED:
      return "取消";
    default:
      return s;
  }
}

function eventCardClasses(ev: CalendarEventRow) {
  if (ev.status === EventStatus.CANCELLED) return "border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 line-through";
  if (ev.status === EventStatus.DRAFT) return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-violet-200 bg-violet-50 text-violet-950";
}

/** 週視圖：七欄（註解：小螢幕改直向堆疊）。 */
export function CoachCalendarWeekGrid({ weekStart, events }: { weekStart: Date; events: CalendarEventRow[] }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = new Map<string, CalendarEventRow[]>();
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
          <div key={key} className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-sm">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {d.toLocaleDateString("zh-TW", { weekday: "long", month: "numeric", day: "numeric" })}
            </div>
            {dayEvents.length === 0 ?
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">無事件</p>
            : (
              <ul className="mt-2 space-y-2">
                {dayEvents.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={`/coach/events/${ev.id}`}
                      className={`block rounded-md border px-2 py-1.5 text-sm ${eventCardClasses(ev)}`}
                    >
                      <span className="font-medium">{ev.title}</span>
                      <span className="mt-0.5 block text-xs opacity-90">
                        {ev.startsAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })} ·{" "}
                        {typeLabel(ev.type)} · {statusShort(ev.status)}
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

/** 週視圖桌面：七欄網格。 */
export function CoachCalendarWeekGridDesktop({ weekStart, events }: { weekStart: Date; events: CalendarEventRow[] }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const byDay = new Map<string, CalendarEventRow[]>();
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
    <div className="hidden overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-200 shadow-sm md:grid md:grid-cols-7 md:gap-px">
      {days.map((d) => {
        const key = toYmd(d);
        const dayEvents = byDay.get(key) ?? [];
        return (
          <div key={key} className="flex min-h-[14rem] flex-col bg-white dark:bg-zinc-900">
            <div className="border-b border-zinc-100 px-2 py-2 text-center text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {d.toLocaleDateString("zh-TW", { weekday: "short" })}
              <div className="text-sm tabular-nums text-zinc-900 dark:text-zinc-50">{d.getDate()}</div>
            </div>
            <div className="flex flex-1 flex-col gap-1 p-1.5">
              {dayEvents.map((ev) => (
                <Link
                  key={ev.id}
                  href={`/coach/events/${ev.id}`}
                  className={`rounded border px-1.5 py-1 text-xs leading-snug ${eventCardClasses(ev)}`}
                >
                  <span className="line-clamp-2 font-medium">{ev.title}</span>
                  <span className="mt-0.5 block tabular-nums opacity-90">
                    {ev.startsAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
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

/** 列表視圖：同週內依時間排序（註解：與週視圖相同區間）。 */
export function CoachCalendarListView({ events }: { events: CalendarEventRow[] }) {
  const sorted = [...events].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  return (
    <ul className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      {sorted.length === 0 ?
        <li className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">此區間無事件</li>
      : sorted.map((ev) => (
          <li key={ev.id}>
            <Link
              href={`/coach/events/${ev.id}`}
              className="flex flex-col gap-1 px-4 py-3 transition hover:bg-zinc-50 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">{ev.title}</span>
                <span className="ml-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {typeLabel(ev.type)} · {statusShort(ev.status)}
                </span>
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
        ))
      }
    </ul>
  );
}

/** 月視圖：六列網格（註解：週一起始；前後月空白格）。 */
export function CoachCalendarMonthGrid({ monthAnchor, events }: { monthAnchor: Date; events: CalendarEventRow[] }) {
  const monthStart = startOfMonth(monthAnchor);
  const gridStart = startOfWeekMonday(monthStart);
  const daysInGrid = 42;
  const cells = Array.from({ length: daysInGrid }, (_, i) => addDays(gridStart, i));

  const byDay = new Map<string, CalendarEventRow[]>();
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
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
      <div className="grid min-w-[640px] grid-cols-7 gap-px bg-zinc-200">
        {weekDayLabels.map((w) => (
          <div key={w} className="bg-zinc-50 dark:bg-zinc-950 py-2 text-center text-xs font-semibold text-zinc-600 dark:text-zinc-400">
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
              className={`min-h-[6.5rem] bg-white dark:bg-zinc-900 p-1 ${inMonth ? "" : "bg-zinc-50 dark:bg-zinc-950/80 text-zinc-400"}`}
            >
              <div className={`text-xs font-medium tabular-nums ${inMonth ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-400"}`}>
                {d.getDate()}
              </div>
              <ul className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={`/coach/events/${ev.id}`}
                      className={`block truncate rounded px-0.5 py-0.5 text-[10px] leading-tight sm:text-xs ${eventCardClasses(ev)}`}
                      title={ev.title}
                    >
                      {ev.startsAt.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}{" "}
                      {ev.title}
                    </Link>
                  </li>
                ))}
                {dayEvents.length > 3 ?
                  <li className="text-[10px] text-zinc-500 dark:text-zinc-400">+{dayEvents.length - 3} 場</li>
                : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
