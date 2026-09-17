"use client";

import { useCallback, useEffect, useState } from "react";

import { memberInitial } from "@/app/coach/(main)/coach-dashboard-ui";
import { FitnessMemberProfilePanel } from "@/components/fitness-member-profile-panel";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useMatchModule, useTeamSport } from "@/components/team-sport-provider";
import type { DashboardMemberFitnessProfile } from "@/lib/fitness/aggregate";
import { computeAgeYears } from "@/lib/member-age";
import type { MemberFitnessAiAnalysis } from "@/lib/team-fitness-ai-schema";
import { computeAdjustedRating } from "@/lib/sports/match/metrics";
import type { PlayerStatsRecord } from "@/lib/sports/match/types";
import { formatDateTimeZh } from "@/lib/format-datetime";

export type DashboardRosterMember = {
  memberId: string;
  displayName: string;
  jerseyNumber: number | null;
  position: string | null;
  squad: string | null;
  birthDate: string | null;
  /** 最新全隊體能分析（註解：排名 + 評語）。 */
  fitnessAnalysis: MemberFitnessAiAnalysis | null;
  fitness: DashboardMemberFitnessProfile;
  match: {
    matchCount: number;
    overall: number | null;
    stats: PlayerStatsRecord;
  } | null;
};

function fmt(value: number | null, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

function perMatch(value: number, matchCount: number): number {
  if (!Number.isFinite(matchCount) || matchCount <= 0) return 0;
  return Math.round((value / matchCount) * 100) / 100;
}

function MetricRow({ label, total, avg }: { label: string; total: number; avg: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{label}</p>
      <div className="flex items-baseline gap-3">
        <span className="text-xs text-zinc-500">總</span>
        <span className="w-16 text-right text-sm font-semibold tabular-nums">{total}</span>
        <span className="text-xs text-zinc-500">均</span>
        <span className="w-16 text-right text-sm font-semibold tabular-nums">{avg}</span>
      </div>
    </div>
  );
}

function MatchProfileBlock({ row }: { row: NonNullable<DashboardRosterMember["match"]> }) {
  const match = useMatchModule();

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">比賽累計</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{row.matchCount} 場</p>
        <dl className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-zinc-500">總指標</dt>
            <dd className="font-semibold tabular-nums">{row.overall != null ? row.overall.toFixed(1) : "—"}</dd>
          </div>
          {match.ratings.map((def) => {
            const { adjusted, lowSample, sampleSize } = computeAdjustedRating(def, row.stats);
            return (
              <div key={def.key}>
                <dt className="text-xs text-zinc-500">
                  {def.label} rating
                  {lowSample ? <span className="text-amber-600">（樣本 {sampleSize}）</span> : null}
                </dt>
                <dd className="font-semibold tabular-nums">{fmt(adjusted)}</dd>
              </div>
            );
          })}
        </dl>
      </div>
      <div className="space-y-3">
        {match.categories.map((c) => {
          if (!match.hasCategoryData(row.stats, c)) return null;
          const cat = row.stats[c] as Record<string, number>;
          const defs = (match.categoryFields[c] ?? []).filter((d) => !d.derived);
          return (
            <div key={c} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                {match.categoryLabels[c]}
              </p>
              {defs.map((d) => (
                <MetricRow
                  key={d.key}
                  label={d.label}
                  total={cat[d.key] ?? 0}
                  avg={perMatch(cat[d.key] ?? 0, row.matchCount)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 教練總覽：隊員名單，點名開啟體能／比賽 popup。 */
export function CoachDashboardRosterSection({ members }: { members: DashboardRosterMember[] }) {
  const sport = useTeamSport();
  const [selected, setSelected] = useState<DashboardRosterMember | null>(null);

  useEffect(() => {
    if (!selected) return;
    const fresh = members.find((m) => m.memberId === selected.memberId);
    if (fresh) setSelected(fresh);
  }, [members, selected?.memberId]);

  const closeMember = useCallback(() => setSelected(null), []);

  if (members.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">尚無使用中隊員。</p>;
  }

  const selectedAge = selected ? computeAgeYears(selected.birthDate) : null;

  return (
    <>
      <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {members.map((m) => (
          <li key={m.memberId}>
            <button
              type="button"
              onClick={() => setSelected(m)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-sky-50/60 dark:hover:bg-sky-950/20"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sm font-semibold text-blue-700 dark:bg-sky-950/50 dark:text-blue-300">
                {memberInitial(m.displayName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">{m.displayName}</p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {[
                    m.position,
                    m.jerseyNumber != null ? `#${m.jerseyNumber}` : null,
                    m.squad,
                    m.fitnessAnalysis ? `體能排名 #${m.fitnessAnalysis.rank}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-blue-600 dark:text-blue-400">詳情</span>
            </button>
          </li>
        ))}
      </ul>

      <BottomSheet
        open={selected !== null}
        onClose={closeMember}
        title={selected?.displayName ?? ""}
        subtitle={
          selected ?
            [
              selected.position,
              selected.jerseyNumber != null ? `#${selected.jerseyNumber}` : null,
            ]
              .filter(Boolean)
              .join(" · ")
          : undefined
        }
        tall
        footer={
          <button
            type="button"
            onClick={closeMember}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
          >
            關閉
          </button>
        }
      >
        {selected ?
          <div className="space-y-6">
            <dl className="grid grid-cols-2 gap-3 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950/50">
              <div>
                <dt className="text-xs text-zinc-500">位置</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50">{selected.position ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">年齡</dt>
                <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                  {selectedAge != null ?
                    `${selectedAge} 歲`
                  : selected.birthDate ?
                    "—"
                  : "未填"}
                </dd>
              </div>
            </dl>
            {selected.fitnessAnalysis ?
              <section className="rounded-lg border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-900 dark:bg-violet-950/20">
                <h3 className="text-sm font-semibold text-violet-900 dark:text-violet-200">
                  AI 體能分析 · 排名 #{selected.fitnessAnalysis.rank}
                </h3>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDateTimeZh(new Date(selected.fitnessAnalysis.generatedAt), {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {selected.fitnessAnalysis.model ? ` · ${selected.fitnessAnalysis.model}` : ""}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                  {selected.fitnessAnalysis.comment}
                </p>
              </section>
            : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                尚無 AI 體能分析。請至總覽「體能分析」產生全隊排名與評語。
              </p>
            )}
            <section>
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">體能表現</h3>
              <FitnessMemberProfilePanel fitness={selected.fitness} />
            </section>
            <section>
              <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">比賽統計</h3>
              {!sport.capabilities.matchStats || !selected.match ?
                <p className="text-sm text-zinc-500 dark:text-zinc-400">尚無比賽個人數據。</p>
              : <MatchProfileBlock row={selected.match} />}
            </section>
          </div>
        : null}
      </BottomSheet>
    </>
  );
}
