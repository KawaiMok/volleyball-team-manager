import Link from "next/link";

import type { CalendarView } from "@/app/coach/(main)/calendar/calendar-utils";
import { addDays, addMonths, parseYmd, startOfMonth, startOfWeekMonday, toYmd } from "@/app/coach/(main)/calendar/calendar-utils";

type Props = {
  view: CalendarView;
  /** 錨點日 YYYY-MM-DD（註解：週／列表用該日所在週；月用該日所在月）。 */
  dateYmd: string;
  typeFilter: string;
  squadFilter: string;
  squads: string[];
  weekLabel: string;
  monthLabel: string;
};

function href(p: {
  view: CalendarView;
  dateYmd: string;
  type: string;
  squad: string;
}) {
  const q = new URLSearchParams();
  q.set("view", p.view);
  q.set("date", p.dateYmd);
  if (p.type && p.type !== "ALL") q.set("type", p.type);
  if (p.squad) q.set("squad", p.squad);
  return `/coach/calendar?${q.toString()}`;
}

/** 週切換、視圖切換、篩選（註解：皆為 GET 連結，利於分享書籤）。 */
export function CalendarToolbar({
  view,
  dateYmd,
  typeFilter,
  squadFilter,
  squads,
  weekLabel,
  monthLabel,
}: Props) {
  const anchor = parseYmd(dateYmd);
  const weekStart = startOfWeekMonday(anchor);
  const prevWeek = toYmd(addDays(weekStart, -7));
  const nextWeek = toYmd(addDays(weekStart, 7));
  const monthStart = startOfMonth(anchor);
  const prevMonth = toYmd(addMonths(monthStart, -1));
  const nextMonth = toYmd(addMonths(monthStart, 1));
  const todayYmd = toYmd(new Date());

  const base = { type: typeFilter, squad: squadFilter };

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">視圖</span>
        {(
          [
            ["week", "週"],
            ["list", "列表"],
            ["month", "月"],
          ] as const
        ).map(([v, label]) => (
          <Link
            key={v}
            href={href({ view: v, dateYmd, ...base })}
            className={
              view === v ?
                "rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
              : "rounded-md border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:bg-zinc-950"
            }
          >
            {label}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
        <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">時間</span>
        {view === "month" ?
          <>
            <Link
              href={href({ view, dateYmd: prevMonth, ...base })}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-sm hover:bg-zinc-50 dark:bg-zinc-950"
            >
              ← 上月
            </Link>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{monthLabel}</span>
            <Link
              href={href({ view, dateYmd: nextMonth, ...base })}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-sm hover:bg-zinc-50 dark:bg-zinc-950"
            >
              下月 →
            </Link>
          </>
        : (
          <>
            <Link
              href={href({ view, dateYmd: prevWeek, ...base })}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-sm hover:bg-zinc-50 dark:bg-zinc-950"
            >
              ← 上週
            </Link>
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{weekLabel}</span>
            <Link
              href={href({ view, dateYmd: nextWeek, ...base })}
              className="rounded-md border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-sm hover:bg-zinc-50 dark:bg-zinc-950"
            >
              下週 →
            </Link>
            <Link
              href={href({ view, dateYmd: todayYmd, ...base })}
              className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-sm text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200"
            >
              本日／本週
            </Link>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
        <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">類型</span>
        {(
          [
            ["ALL", "全部"],
            ["TRAINING", "訓練"],
            ["MATCH", "比賽"],
            ["OTHER", "其他"],
          ] as const
        ).map(([val, label]) => (
          <Link
            key={val}
            href={href({ view, dateYmd, type: val, squad: squadFilter })}
            className={
              typeFilter === val ?
                "rounded-md bg-violet-100 px-2.5 py-1 text-sm font-medium text-violet-900"
              : "rounded-md px-2.5 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800"
            }
          >
            {label}
          </Link>
        ))}
      </div>

      {squads.length > 0 ?
        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4">
          <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">分組</span>
          <Link
            href={href({ view, dateYmd, type: typeFilter, squad: "" })}
            className={
              !squadFilter ?
                "rounded-md bg-emerald-100 px-2.5 py-1 text-sm font-medium text-emerald-900"
              : "rounded-md px-2.5 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800"
            }
          >
            全部
          </Link>
          {squads.map((s) => (
            <Link
              key={s}
              href={href({ view, dateYmd, type: typeFilter, squad: s })}
              className={
                squadFilter === s ?
                  "rounded-md bg-emerald-100 px-2.5 py-1 text-sm font-medium text-emerald-900"
                : "rounded-md px-2.5 py-1 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:bg-zinc-800"
              }
            >
              {s}
            </Link>
          ))}
        </div>
      : null}
    </div>
  );
}
