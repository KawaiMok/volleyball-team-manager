"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import type {
  AttendanceStatsPeriod,
  MemberAttendanceStatRow,
} from "@/lib/attendance-stats";
import { InlineSpinner } from "@/components/inline-spinner";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";

export type TeamAttendanceStatsPayload = {
  bounds: {
    period: AttendanceStatsPeriod;
    label: string;
    prevAnchorYmd: string;
    nextAnchorYmd: string;
  };
  rows: MemberAttendanceStatRow[];
  totalEvents: number;
};

const PERIOD_LABELS: Record<AttendanceStatsPeriod, string> = {
  week: "週",
  month: "月",
  year: "年",
};

function rateBarClass(rate: number | null): string {
  if (rate == null) return "bg-zinc-200 dark:bg-zinc-700";
  if (rate >= 80) return "bg-emerald-500";
  if (rate >= 50) return "bg-amber-500";
  return "bg-red-500";
}

type Props = {
  initialPeriod?: AttendanceStatsPeriod;
  /** 伺服端預載的預設區間資料（註解：避免 mount 後 client fetch 瀑布）。 */
  initialData?: TeamAttendanceStatsPayload;
};

/** 教練端：球員出席率（週／月／年）（註解：資料來自點名 checkedIn）。 */
export function TeamAttendanceStats({ initialPeriod = "month", initialData }: Props) {
  const [period, setPeriod] = useState<AttendanceStatsPeriod>(initialPeriod);
  const [anchorYmd, setAnchorYmd] = useState<string | undefined>(undefined);
  const [data, setData] = useState<TeamAttendanceStatsPayload | null>(initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  const load = useCallback(async (p: AttendanceStatsPeriod, date?: string) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ period: p });
      if (date) q.set("date", date);
      const res = await fetch(`/api/team/attendance-stats?${q.toString()}`, { credentials: "include" });
      const json = (await res.json()) as TeamAttendanceStatsPayload & { error?: string };
      if (res.ok && json.bounds) {
        setData(json);
      }
    } finally {
      setLoading(false);
      setPendingKey(null);
    }
  }, []);

  useEffect(() => {
    const isDefaultView = period === initialPeriod && anchorYmd === undefined;
    if (initialData && isDefaultView) {
      setData(initialData);
      return;
    }
    startTransition(() => {
      void load(period, anchorYmd);
    });
  }, [period, anchorYmd, load, startTransition, initialData, initialPeriod]);

  function requestChange(nextPeriod: AttendanceStatsPeriod, nextAnchor?: string, key?: string) {
    setPendingKey(key ?? null);
    setPeriod(nextPeriod);
    setAnchorYmd(nextAnchor);
  }

  const busy = loading || isPending;

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          出席率統計
        </h2>
        <HintExclamationToggle>
          僅統計<strong className="font-medium">已發布且已結束</strong>、且該員為參與者之場次。出席＝教練點名「實到」（checkedIn）。
        </HintExclamationToggle>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400">區間</span>
        {(Object.keys(PERIOD_LABELS) as AttendanceStatsPeriod[]).map((p) => {
          const key = `period:${p}`;
          const loadingBtn = busy && pendingKey === key;
          return (
            <button
              key={p}
              type="button"
              disabled={busy}
              onClick={() => requestChange(p, undefined, key)}
              className={
                period === p ?
                  "inline-flex min-h-[2.25rem] min-w-[2.5rem] items-center justify-center rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
                : "inline-flex min-h-[2.25rem] min-w-[2.5rem] items-center justify-center rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-950"
              }
              aria-current={period === p ? "true" : undefined}
            >
              {loadingBtn ? <InlineSpinner /> : PERIOD_LABELS[p]}
            </button>
          );
        })}
      </div>

      {data ?
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            disabled={busy}
            onClick={() => requestChange(period, data.bounds.prevAnchorYmd, "nav:prev")}
            className="inline-flex min-h-[2rem] min-w-[4rem] items-center justify-center rounded-md border border-zinc-200 px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950"
          >
            {busy && pendingKey === "nav:prev" ? <InlineSpinner /> : "← 上一段"}
          </button>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{data.bounds.label}</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => requestChange(period, data.bounds.nextAnchorYmd, "nav:next")}
            className="inline-flex min-h-[2rem] min-w-[4rem] items-center justify-center rounded-md border border-zinc-200 px-2 py-1 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950"
          >
            {busy && pendingKey === "nav:next" ? <InlineSpinner /> : "下一段 →"}
          </button>
          <span className="w-full text-xs text-zinc-500 dark:text-zinc-400 sm:w-auto">
            區間內已結束場次：{data.totalEvents} 場
          </span>
        </div>
      : null}

      {loading && !data ?
        <div className="flex justify-center py-10">
          <InlineSpinner className="h-8 w-8" />
        </div>
      : !data || data.rows.length === 0 ?
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">此區間尚無可統計的已結束場次或無在籍隊員。</p>
      : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="py-2 pr-3 font-medium">球員</th>
                <th className="py-2 pr-3 font-medium text-center">應出席</th>
                <th className="py-2 pr-3 font-medium text-center">實到</th>
                <th className="py-2 pr-3 font-medium">出席率</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.memberId} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="py-2.5 pr-3">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{row.displayName}</span>
                    {row.squad ?
                      <span className="ml-1.5 text-xs text-zinc-500 dark:text-zinc-400">({row.squad})</span>
                    : null}
                  </td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{row.eligible}</td>
                  <td className="py-2.5 pr-3 text-center tabular-nums">{row.attended}</td>
                  <td className="py-2.5 pr-3">
                    {row.ratePercent != null ?
                      <div className="flex min-w-[7rem] items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div
                            className={`h-full rounded-full ${rateBarClass(row.ratePercent)}`}
                            style={{ width: `${Math.min(100, row.ratePercent)}%` }}
                          />
                        </div>
                        <span className="w-12 shrink-0 text-right tabular-nums font-medium">
                          {row.ratePercent}%
                        </span>
                      </div>
                    : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
