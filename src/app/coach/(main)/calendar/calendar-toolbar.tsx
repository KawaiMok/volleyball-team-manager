"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

import type { CalendarView } from "@/app/coach/(main)/calendar/calendar-utils";
import {
  addDays,
  addMonths,
  parseYmd,
  startOfMonth,
  startOfWeekMonday,
  toYmd,
} from "@/app/coach/(main)/calendar/calendar-utils";
import { InlineSpinner } from "@/components/inline-spinner";

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

function buildHref(p: {
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

const viewBtnBase =
  "inline-flex min-h-[2.25rem] min-w-[3.25rem] items-center justify-center rounded-md px-3 py-1.5 text-sm";
const viewBtnActive = `${viewBtnBase} bg-zinc-900 text-white`;
const viewBtnIdle = `${viewBtnBase} border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-950`;

const navBtnClass =
  "inline-flex min-h-[2rem] min-w-[4.5rem] items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-950";

const chipActive = "rounded-md px-2.5 py-1 text-sm font-medium";
const chipIdle = "rounded-md px-2.5 py-1 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800";

/** 週切換、視圖切換、篩選（註解：client 導覽＋按鈕轉圈，與球員行程工具列一致）。 */
export function CalendarToolbar({
  view,
  dateYmd,
  typeFilter,
  squadFilter,
  squads,
  weekLabel,
  monthLabel,
}: Props) {
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

  const base = { type: typeFilter, squad: squadFilter };

  const currentHref = `${pathname}?${searchParams.toString()}`;

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

  function ToolbarButton({
    label,
    target,
    active,
    activeClass,
    idleClass,
  }: {
    label: string;
    target: string;
    active?: boolean;
    activeClass?: string;
    idleClass?: string;
  }) {
    const loading = isPending && pendingHref === target;
    return (
      <button
        type="button"
        disabled={isPending}
        onClick={() => navigate(target)}
        className={active ? (activeClass ?? viewBtnActive) : (idleClass ?? viewBtnIdle)}
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
    <div className="space-y-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">視圖</span>
        <ToolbarButton
          label="週"
          target={buildHref({ view: "week", dateYmd, ...base })}
          active={view === "week"}
        />
        <ToolbarButton
          label="列表"
          target={buildHref({ view: "list", dateYmd, ...base })}
          active={view === "list"}
        />
        <ToolbarButton
          label="月"
          target={buildHref({ view: "month", dateYmd, ...base })}
          active={view === "month"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">時間</span>
        {view === "month" ?
          <>
            <NavButton label="← 上月" target={buildHref({ view, dateYmd: prevMonth, ...base })} />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{monthLabel}</span>
            <NavButton label="下月 →" target={buildHref({ view, dateYmd: nextMonth, ...base })} />
          </>
        : (
          <>
            <NavButton label="← 上週" target={buildHref({ view, dateYmd: prevWeek, ...base })} />
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{weekLabel}</span>
            <NavButton label="下週 →" target={buildHref({ view, dateYmd: nextWeek, ...base })} />
            <NavButton label="本日／本週" target={buildHref({ view, dateYmd: todayYmd, ...base })} />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
        <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">類型</span>
        {(
          [
            ["ALL", "全部"],
            ["TRAINING", "訓練"],
            ["MATCH", "比賽"],
            ["OTHER", "其他"],
          ] as const
        ).map(([val, label]) => (
          <ToolbarButton
            key={val}
            label={label}
            target={buildHref({ view, dateYmd, type: val, squad: squadFilter })}
            active={typeFilter === val}
            activeClass={`${chipActive} bg-violet-100 text-violet-900`}
            idleClass={`${chipIdle} text-zinc-600 dark:text-zinc-400`}
          />
        ))}
      </div>

      {squads.length > 0 ?
        <div className="flex flex-wrap items-center gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">分組</span>
          <ToolbarButton
            label="全部"
            target={buildHref({ view, dateYmd, type: typeFilter, squad: "" })}
            active={!squadFilter}
            activeClass={`${chipActive} bg-emerald-100 text-emerald-900`}
            idleClass={`${chipIdle} text-zinc-600 dark:text-zinc-400`}
          />
          {squads.map((s) => (
            <ToolbarButton
              key={s}
              label={s}
              target={buildHref({ view, dateYmd, type: typeFilter, squad: s })}
              active={squadFilter === s}
              activeClass={`${chipActive} bg-emerald-100 text-emerald-900`}
              idleClass={`${chipIdle} text-zinc-600 dark:text-zinc-400`}
            />
          ))}
        </div>
      : null}
    </div>
  );
}
