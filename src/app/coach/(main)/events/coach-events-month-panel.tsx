import Link from "next/link";

import {
  CoachCalendarMonthGrid,
  type CalendarEventRow,
} from "@/app/coach/(main)/calendar/calendar-views";
import { addMonths, parseYmd, toYmd } from "@/app/coach/(main)/calendar/calendar-utils";
import { formatDateZh } from "@/lib/format-datetime";

type Props = {
  monthAnchor: Date;
  events: CalendarEventRow[];
  /** 保留列表篩選的查詢字串（註解：切換月份時不丟失篩選）。 */
  listQuery: string;
};

function monthNavHref(listQuery: string, anchor: Date) {
  const params = new URLSearchParams(listQuery);
  params.set("cal", toYmd(anchor));
  const qs = params.toString();
  return qs ? `/coach/events?${qs}` : `/coach/events?cal=${toYmd(anchor)}`;
}

/** 事件頁右側：月曆（註解：點事件進詳情；可切換月份）。 */
export function CoachEventsMonthPanel({ monthAnchor, events, listQuery }: Props) {
  const monthLabel = formatDateZh(monthAnchor, { year: "numeric", month: "long" });
  const prevMonth = addMonths(monthAnchor, -1);
  const nextMonth = addMonths(monthAnchor, 1);
  const calDate = toYmd(monthAnchor);
  const fullCalendarHref = `/coach/calendar?view=month&date=${calDate}`;

  return (
    <section className="min-w-0 rounded-xl border border-sky-100 bg-sky-50/40 p-3 dark:border-sky-900/40 dark:bg-sky-950/20 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{monthLabel}</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">事件月曆 · 點場次進入詳情</p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={monthNavHref(listQuery, prevMonth)}
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="上一個月"
          >
            ‹
          </Link>
          <Link
            href={monthNavHref(listQuery, parseYmd(toYmd(new Date())))}
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            今天
          </Link>
          <Link
            href={monthNavHref(listQuery, nextMonth)}
            className="rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            aria-label="下一個月"
          >
            ›
          </Link>
        </div>
      </div>

      <CoachCalendarMonthGrid monthAnchor={monthAnchor} events={events} />

      <p className="mt-3 text-right">
        <Link href={fullCalendarHref} className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
          完整行事曆 →
        </Link>
      </p>
    </section>
  );
}

/** 組合事件頁 URL 查詢（註解：列表篩選 + 月曆錨點）。 */
export function buildCoachEventsListQuery(sp: {
  q?: string;
  from?: string;
  to?: string;
  etype?: string | string[];
  estatus?: string | string[];
  squad?: string;
  cal?: string;
}): string {
  const params = new URLSearchParams();
  const q = (sp.q ?? "").trim();
  if (q) params.set("q", q);
  if (sp.from) params.set("from", sp.from);
  if (sp.to) params.set("to", sp.to);
  const etypes = Array.isArray(sp.etype) ? sp.etype : sp.etype ? [sp.etype] : [];
  for (const t of etypes) params.append("etype", t);
  const estatuses = Array.isArray(sp.estatus) ? sp.estatus : sp.estatus ? [sp.estatus] : [];
  for (const s of estatuses) params.append("estatus", s);
  if (sp.squad) params.set("squad", sp.squad);
  if (sp.cal) params.set("cal", sp.cal);
  return params.toString();
}
