"use client";

import { useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { MATCH_TEAM_STAT_LABELS, type MatchTeamStats } from "@/lib/match-result-schema";

export type TeamStatKey = keyof typeof MATCH_TEAM_STAT_LABELS;

export type TeamStatsForm = Record<TeamStatKey, string>;

const TEAM_STAT_KEYS = Object.keys(MATCH_TEAM_STAT_LABELS) as TeamStatKey[];

/** 手機列表一行摘要（註解：已填欄位）。 */
export function teamStatsSummary(stats: TeamStatsForm | MatchTeamStats | null | undefined): string {
  if (!stats) return "尚未填寫";
  const parts: string[] = [];
  for (const key of TEAM_STAT_KEYS) {
    const raw = typeof stats[key] === "number" ? String(stats[key]) : (stats as TeamStatsForm)[key]?.trim();
    if (raw) parts.push(`${MATCH_TEAM_STAT_LABELS[key]} ${raw}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "尚未填寫";
}

function TeamStatsFields({
  teamStats,
  onChange,
  readOnly = false,
}: {
  teamStats: TeamStatsForm;
  onChange?: (key: TeamStatKey, value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-4">
      {TEAM_STAT_KEYS.map((key) =>
        readOnly ?
          teamStats[key]?.trim() ?
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950"
            >
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{MATCH_TEAM_STAT_LABELS[key]}</span>
              <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {teamStats[key]}
              </span>
            </div>
          : null
        : (
          <label key={key} className="block space-y-1.5">
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{MATCH_TEAM_STAT_LABELS[key]}</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={teamStats[key]}
              placeholder="選填"
              onChange={(e) => onChange?.(key, e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base tabular-nums dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
        ),
      )}
    </div>
  );
}

type InputProps = {
  teamStats: TeamStatsForm;
  onChange: (key: TeamStatKey, value: string) => void;
};

/** 球隊數據輸入：桌機網格 + 手機 popup。 */
export function MatchTeamStatsInputSection({ teamStats, onChange }: InputProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const filled = teamStatsSummary(teamStats) !== "尚未填寫";

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">球隊數據（選填）</h3>

      {/* 桌機 */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {TEAM_STAT_KEYS.map((key) => (
          <label key={key} className="block space-y-1 text-sm">
            <span className="text-zinc-600 dark:text-zinc-400">{MATCH_TEAM_STAT_LABELS[key]}</span>
            <input
              type="number"
              min={0}
              value={teamStats[key]}
              onChange={(e) => onChange(key, e.target.value)}
              className="w-full rounded border border-zinc-300 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
        ))}
      </div>

      {/* 手機 */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 px-3 py-3 text-left hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">球隊整體數據</p>
            <p className={`mt-0.5 truncate text-xs ${filled ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400"}`}>
              {teamStatsSummary(teamStats)}
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-[var(--brand-primary)]">
            {filled ? "編輯" : "填寫"}
          </span>
        </button>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="球隊數據"
        subtitle="選填 · 整體比賽統計"
        tall
        footer={
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="w-full rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            完成
          </button>
        }
      >
        <TeamStatsFields teamStats={teamStats} onChange={onChange} />
      </BottomSheet>
    </div>
  );
}

/** 將 API 球隊 stats 轉成表單字串（註解：檢視 popup 用）。 */
export function matchTeamStatsToForm(stats: MatchTeamStats | null | undefined): TeamStatsForm {
  const form = {} as TeamStatsForm;
  for (const key of TEAM_STAT_KEYS) {
    const v = stats?.[key];
    form[key] = v != null ? String(v) : "";
  }
  return form;
}

type ViewProps = {
  teamStats: MatchTeamStats | null;
};

/** 球隊數據檢視：桌機 StatBar + 手機 popup。 */
export function MatchTeamStatsViewSection({ teamStats }: ViewProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const entries = TEAM_STAT_KEYS.map((key) => ({
    key,
    label: MATCH_TEAM_STAT_LABELS[key],
    value: teamStats?.[key],
  })).filter((e) => typeof e.value === "number" && e.value > 0) as Array<{
    key: TeamStatKey;
    label: string;
    value: number;
  }>;

  if (entries.length === 0) return null;

  const max = Math.max(...entries.map((e) => e.value), 1);
  const form = matchTeamStatsToForm(teamStats);

  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-200">球隊數據</h3>

      {/* 桌機 */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-2">
        {entries.map(({ key, label, value }) => (
          <div key={key}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
              <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">{value}</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-[var(--brand-primary)] transition-all"
                style={{ width: `${Math.round((value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 手機 */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="flex w-full items-center gap-3 rounded-lg border border-zinc-200 px-3 py-3 text-left hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">球隊整體數據</p>
            <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
              {teamStatsSummary(form)}
            </p>
          </div>
          <span className="shrink-0 text-xs text-zinc-400">詳情</span>
        </button>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="球隊數據"
        subtitle="整體比賽統計"
        footer={
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
          >
            關閉
          </button>
        }
      >
        <TeamStatsFields teamStats={form} readOnly />
      </BottomSheet>
    </div>
  );
}
