"use client";

import { useMemo, useState } from "react";

type SortKey =
  | "displayName"
  | "eligibleEvents"
  | "attendedEvents"
  | "attendanceRatePct"
  | "feedbackCount"
  | "avgRpe"
  | "avgFatigueLabel"
  | "avgPainLabel"
  | "mostRecentFeedbackAt";

type SortDir = "asc" | "desc";

export type MemberStatsTableRow = {
  memberId: string;
  displayName: string;
  squad: string | null;
  jerseyNumber: number | null;
  eligibleEvents: number;
  attendedEvents: number;
  attendanceRatePct: number | null;
  feedbackCount: number;
  avgRpe: number | null;
  avgFatigueLabel: string;
  avgPainLabel: string;
  mostRecentFeedbackAtLabel: string;
  mostRecentFeedbackAtMs: number | null;
};

function compareNullable(a: number | null, b: number | null, dir: SortDir) {
  const av = a ?? (dir === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
  const bv = b ?? (dir === "asc" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY);
  return dir === "asc" ? av - bv : bv - av;
}

function nextDir(current: SortDir): SortDir {
  return current === "asc" ? "desc" : "asc";
}

function ThButton({
  label,
  active,
  dir,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "center" | "right";
}) {
  const alignClass = align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex w-full items-center gap-1 hover:underline ${alignClass}`}
      aria-label={active ? `排序：${label}（目前 ${dir === "asc" ? "升冪" : "降冪"}，點擊切換）` : `排序：${label}`}
    >
      <span>{label}</span>
      {active ? <span aria-hidden className="text-[10px] text-zinc-400">{dir === "asc" ? "▲" : "▼"}</span> : null}
    </button>
  );
}

/** 球員總表（註解：client 端排序互動；資料由 server page 彙總後傳入）。 */
export function MemberStatsTable({ rows }: { rows: MemberStatsTableRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("attendanceRatePct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sorted = useMemo(() => {
    const out = [...rows];
    out.sort((a, b) => {
      if (sortKey === "displayName") {
        const cmp = a.displayName.localeCompare(b.displayName, "zh-Hant");
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortKey === "avgFatigueLabel") {
        const cmp = a.avgFatigueLabel.localeCompare(b.avgFatigueLabel, "zh-Hant");
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortKey === "avgPainLabel") {
        const cmp = a.avgPainLabel.localeCompare(b.avgPainLabel, "zh-Hant");
        return sortDir === "asc" ? cmp : -cmp;
      }
      if (sortKey === "mostRecentFeedbackAt") {
        return compareNullable(a.mostRecentFeedbackAtMs, b.mostRecentFeedbackAtMs, sortDir);
      }
      if (sortKey === "eligibleEvents") return compareNullable(a.eligibleEvents, b.eligibleEvents, sortDir);
      if (sortKey === "attendedEvents") return compareNullable(a.attendedEvents, b.attendedEvents, sortDir);
      if (sortKey === "attendanceRatePct") return compareNullable(a.attendanceRatePct, b.attendanceRatePct, sortDir);
      if (sortKey === "feedbackCount") return compareNullable(a.feedbackCount, b.feedbackCount, sortDir);
      if (sortKey === "avgRpe") return compareNullable(a.avgRpe, b.avgRpe, sortDir);
      return 0;
    });
    return out;
  }, [rows, sortKey, sortDir]);

  function setSort(k: SortKey) {
    if (k === sortKey) {
      setSortDir((d) => nextDir(d));
      return;
    }
    setSortKey(k);
    setSortDir(k === "displayName" ? "asc" : "desc");
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[58rem] text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="py-2 pr-3 font-medium">
              <ThButton label="球員" active={sortKey === "displayName"} dir={sortDir} onClick={() => setSort("displayName")} />
            </th>
            <th className="py-2 pr-3 font-medium text-center">
              <ThButton label="應出席" active={sortKey === "eligibleEvents"} dir={sortDir} onClick={() => setSort("eligibleEvents")} align="center" />
            </th>
            <th className="py-2 pr-3 font-medium text-center">
              <ThButton label="實到" active={sortKey === "attendedEvents"} dir={sortDir} onClick={() => setSort("attendedEvents")} align="center" />
            </th>
            <th className="py-2 pr-3 font-medium text-center">
              <ThButton label="出席率" active={sortKey === "attendanceRatePct"} dir={sortDir} onClick={() => setSort("attendanceRatePct")} align="center" />
            </th>
            <th className="py-2 pr-3 font-medium text-center">
              <ThButton label="回饋" active={sortKey === "feedbackCount"} dir={sortDir} onClick={() => setSort("feedbackCount")} align="center" />
            </th>
            <th className="py-2 pr-3 font-medium text-center">
              <ThButton label="RPE 平均" active={sortKey === "avgRpe"} dir={sortDir} onClick={() => setSort("avgRpe")} align="center" />
            </th>
            <th className="py-2 pr-3 font-medium text-center">
              <ThButton label="疲勞平均" active={sortKey === "avgFatigueLabel"} dir={sortDir} onClick={() => setSort("avgFatigueLabel")} align="center" />
            </th>
            <th className="py-2 pr-3 font-medium text-center">
              <ThButton label="疼痛平均" active={sortKey === "avgPainLabel"} dir={sortDir} onClick={() => setSort("avgPainLabel")} align="center" />
            </th>
            <th className="py-2 pr-3 font-medium">
              <ThButton label="最近回饋" active={sortKey === "mostRecentFeedbackAt"} dir={sortDir} onClick={() => setSort("mostRecentFeedbackAt")} />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {sorted.map((r) => (
            <tr key={r.memberId} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/60">
              <td className="py-2.5 pr-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                    {r.displayName}
                    {r.jerseyNumber != null ? <span className="ml-1 text-xs text-zinc-500">#{r.jerseyNumber}</span> : null}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{r.squad ? `分組 ${r.squad}` : "未分組"}</p>
                </div>
              </td>
              <td className="py-2.5 pr-3 text-center tabular-nums">{r.eligibleEvents}</td>
              <td className="py-2.5 pr-3 text-center tabular-nums">{r.attendedEvents}</td>
              <td className="py-2.5 pr-3 text-center tabular-nums">
                {r.attendanceRatePct != null ? `${r.attendanceRatePct.toFixed(1)}%` : "—"}
              </td>
              <td className="py-2.5 pr-3 text-center tabular-nums">{r.feedbackCount}</td>
              <td className="py-2.5 pr-3 text-center tabular-nums">{r.avgRpe != null ? r.avgRpe.toFixed(1) : "—"}</td>
              <td className="py-2.5 pr-3 text-center">{r.avgFatigueLabel}</td>
              <td className="py-2.5 pr-3 text-center">{r.avgPainLabel}</td>
              <td className="py-2.5 pr-3 text-xs text-zinc-600 dark:text-zinc-400">{r.mostRecentFeedbackAtLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

