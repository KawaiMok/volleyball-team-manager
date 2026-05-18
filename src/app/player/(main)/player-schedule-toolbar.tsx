"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import {
  addDays,
  addMonths,
  parseYmd,
  startOfMonth,
  startOfWeekMonday,
  toYmd,
} from "@/app/coach/(main)/calendar/calendar-utils";
import { InlineSpinner } from "@/components/inline-spinner";

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

const viewBtnBase =
  "inline-flex min-h-[2.25rem] min-w-[3.25rem] items-center justify-center rounded-lg px-3 py-1.5 text-sm";
const viewBtnActive = `${viewBtnBase} bg-slate-900 text-white`;
const viewBtnIdle = `${viewBtnBase} border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-950`;

const navBtnClass =
  "inline-flex min-h-[2rem] min-w-[4.5rem] items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 px-2 py-1 text-sm hover:bg-slate-50 dark:hover:bg-slate-950";

/** 列表／週／月切換與週／月導覽（註解：client 導覽＋按鈕轉圈，避免切換時畫面未更新造成困惑）。 */
export function PlayerScheduleToolbar({ view, dateYmd, weekLabel, monthLabel }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const anchor = parseYmd(dateYmd);
  const weekStart = startOfWeekMonday(anchor);
  const prevWeek = toYmd(addDays(weekStart, -7));
  const nextWeek = toYmd(addDays(weekStart, 7));
  const monthStart = startOfMonth(anchor);
  const prevMonth = toYmd(addMonths(monthStart, -1));
  const nextMonth = toYmd(addMonths(monthStart, 1));
  const todayYmd = toYmd(new Date());

  const currentHref =
    pathname === "/player" ?
      searchParams.toString() ? `/player?${searchParams.toString()}` : "/player"
    : `${pathname}?${searchParams.toString()}`;

  useEffect(() => {
    if (!isPending) setPendingHref(null);
  }, [isPending, currentHref]);

  const navigate = useCallback(
    (target: string) => {
      if (target === currentHref) return;
      setPendingHref(target);
      startTransition(() => {
        router.push(target);
      });
    },
    [currentHref, router, startTransition],
  );

  function ViewButton({ label, target, active }: { label: string; target: string; active: boolean }) {
    const loading = isPending && pendingHref === target;
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => navigate(target)}
        className={active ? viewBtnActive : viewBtnIdle}
        aria-busy={loading}
        aria-current={active ? "page" : undefined}
      >
        {loading ? <InlineSpinner /> : label}
      </button>
    );
  }

  function NavButton({ label, target }: { label: string; target: string }) {
    const loading = isPending && pendingHref === target;
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => navigate(target)}
        className={navBtnClass}
        aria-busy={loading}
      >
        {loading ? <InlineSpinner /> : label}
      </button>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">視圖</span>
        <ViewButton label="列表" target="/player" active={view === "list"} />
        <ViewButton label="週" target={href("week", dateYmd)} active={view === "week"} />
        <ViewButton label="月" target={href("month", dateYmd)} active={view === "month"} />
      </div>

      {view === "week" ?
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">時間</span>
          <NavButton label="← 上週" target={href("week", prevWeek)} />
          <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{weekLabel}</span>
          <NavButton label="下週 →" target={href("week", nextWeek)} />
          <NavButton label="本週" target={href("week", todayYmd)} />
        </div>
      : view === "month" ?
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">時間</span>
          <NavButton label="← 上月" target={href("month", prevMonth)} />
          <span className="text-sm font-medium text-slate-900 dark:text-slate-50">{monthLabel}</span>
          <NavButton label="下月 →" target={href("month", nextMonth)} />
          <NavButton label="本月" target={href("month", todayYmd)} />
        </div>
      : (
        <p className="border-t border-slate-100 pt-3 text-xs text-slate-500 dark:text-slate-400 dark:border-slate-800">
          使用「週」或「月」可依日曆瀏覽已發布、且你有參與的場次。
        </p>
      )}
    </div>
  );
}