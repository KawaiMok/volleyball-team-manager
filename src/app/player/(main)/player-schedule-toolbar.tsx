import Link from "next/link";

import {
  addDays,
  addMonths,
  parseYmd,
  startOfMonth,
  startOfWeekMonday,
  toYmd,
} from "@/app/coach/(main)/calendar/calendar-utils";

import type { PlayerScheduleView } from "@/app/player/(main)/player-schedule-view";

type Props = {
  view: PlayerScheduleView;
  /** 錨點日 YYYY-MM-DD（註解：列表時亦用於切到週／月的起始參考）。 */
  dateYmd: string;
  weekLabel: string;
  monthLabel: string;
};

function href(view: PlayerScheduleView, dateYmd: string) {
  if (view === "list") return "/player";
  const q = new URLSearchParams();
  q.set("view", view);
  q.set("date", dateYmd);
  return `/player?${q.toString()}`;
}

/** 列表／週／月切換與週／月導覽（註解：GET 連結，與教練行事曆相同策略）。 */
export function PlayerScheduleToolbar({ view, dateYmd, weekLabel, monthLabel }: Props) {
  const anchor = parseYmd(dateYmd);
  const weekStart = startOfWeekMonday(anchor);
  const prevWeek = toYmd(addDays(weekStart, -7));
  const nextWeek = toYmd(addDays(weekStart, 7));
  const monthStart = startOfMonth(anchor);
  const prevMonth = toYmd(addMonths(monthStart, -1));
  const nextMonth = toYmd(addMonths(monthStart, 1));
  const todayYmd = toYmd(new Date());

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase text-slate-500">視圖</span>
        <Link
          href="/player"
          className={
            view === "list" ?
              "rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
            : "rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          }
        >
          列表
        </Link>
        <Link
          href={href("week", dateYmd)}
          className={
            view === "week" ?
              "rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
            : "rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          }
        >
          週
        </Link>
        <Link
          href={href("month", dateYmd)}
          className={
            view === "month" ?
              "rounded-lg bg-slate-900 px-3 py-1.5 text-sm text-white"
            : "rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          }
        >
          月
        </Link>
      </div>

      {view === "week" ?
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <span className="text-xs font-medium uppercase text-slate-500">時間</span>
          <Link
            href={href("week", prevWeek)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
          >
            ← 上週
          </Link>
          <span className="text-sm font-medium text-slate-900">{weekLabel}</span>
          <Link
            href={href("week", nextWeek)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
          >
            下週 →
          </Link>
          <Link
            href={href("week", todayYmd)}
            className="rounded-lg bg-slate-100 px-2 py-1 text-sm text-slate-800 hover:bg-slate-200"
          >
            本週
          </Link>
        </div>
      : view === "month" ?
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          <span className="text-xs font-medium uppercase text-slate-500">時間</span>
          <Link
            href={href("month", prevMonth)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
          >
            ← 上月
          </Link>
          <span className="text-sm font-medium text-slate-900">{monthLabel}</span>
          <Link
            href={href("month", nextMonth)}
            className="rounded-lg border border-slate-200 px-2 py-1 text-sm hover:bg-slate-50"
          >
            下月 →
          </Link>
          <Link
            href={href("month", todayYmd)}
            className="rounded-lg bg-slate-100 px-2 py-1 text-sm text-slate-800 hover:bg-slate-200"
          >
            本月
          </Link>
        </div>
      : (
        <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
          使用「週」或「月」可依日曆瀏覽已發布、且你有參與的場次。
        </p>
      )}
    </div>
  );
}
