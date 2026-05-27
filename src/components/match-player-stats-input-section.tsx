"use client";

import { useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  CATEGORY_FIELDS,
  derivedStatValue,
  playerOverallSummary,
} from "@/lib/match-player-stats-fields";
import {
  hasAnyPlayerStats,
  hasCategoryData,
  STAT_CATEGORIES,
  STAT_CATEGORY_LABELS,
  type MatchResultPlayerRow,
  type StatCategory,
} from "@/lib/match-result-schema";

type Props = {
  playerRows: MatchResultPlayerRow[];
  onUpdateStat: (memberId: string, category: StatCategory, field: string, value: string) => void;
};

function parseDisplayInt(value: number): string {
  return value === 0 ? "" : String(value);
}

function CategoryTabs({
  active,
  onChange,
  className = "",
}: {
  active: StatCategory;
  onChange: (tab: StatCategory) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {STAT_CATEGORIES.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            active === c ?
              "bg-[var(--brand-primary)] text-white"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {STAT_CATEGORY_LABELS[c]}
        </button>
      ))}
    </div>
  );
}

/** popup 內：分類 tab + 輸入欄位。 */
function PlayerStatSheetForm({
  player,
  category,
  onCategoryChange,
  onUpdateStat,
}: {
  player: MatchResultPlayerRow;
  category: StatCategory;
  onCategoryChange: (tab: StatCategory) => void;
  onUpdateStat: Props["onUpdateStat"];
}) {
  const fields = CATEGORY_FIELDS[category];
  const cat = player.stats[category] as Record<string, number>;

  return (
    <div className="space-y-4">
      <CategoryTabs active={category} onChange={onCategoryChange} />
      <div className="space-y-4 pt-1">
        {fields.map((f) =>
          f.derived ?
            <div
              key={f.key}
              className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950"
            >
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{f.label}</span>
              <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {derivedStatValue(player.stats, f.derived)}
              </span>
            </div>
          : (
            <label key={f.key} className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{f.label}</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={parseDisplayInt(cat[f.key] ?? 0)}
                placeholder="0"
                onChange={(e) => onUpdateStat(player.memberId, category, f.key, e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-base tabular-nums dark:border-zinc-700 dark:bg-zinc-950"
              />
            </label>
          ),
        )}
      </div>
    </div>
  );
}

/** 個人數據輸入：桌機表格 + 手機 popup（分類 tab 在 popup 內）。 */
export function MatchPlayerStatsInputSection({ playerRows, onUpdateStat }: Props) {
  const [statTab, setStatTab] = useState<StatCategory>("attack");
  const [sheetPlayer, setSheetPlayer] = useState<MatchResultPlayerRow | null>(null);
  const [sheetCategory, setSheetCategory] = useState<StatCategory>("attack");
  const fields = CATEGORY_FIELDS[statTab];

  function openPlayerSheet(player: MatchResultPlayerRow) {
    const initial = STAT_CATEGORIES.find((c) => hasCategoryData(player.stats, c)) ?? "attack";
    setSheetCategory(initial);
    setSheetPlayer(player);
  }

  function closePlayerSheet() {
    setSheetPlayer(null);
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">個人數據</h3>

      {/* 桌機：分類 tab + 寬表格 */}
      <div className="hidden md:block">
        <CategoryTabs active={statTab} onChange={setStatTab} className="mb-3" />
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[7rem]" />
              {fields.map((f) => (
                <col key={f.key} />
              ))}
            </colgroup>
            <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-950">
              <tr>
                <th className="px-2 py-2 text-left font-medium">球員</th>
                {fields.map((f) => (
                  <th key={f.key} className="px-1 py-2 text-center font-medium whitespace-nowrap">
                    {f.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {playerRows.map((p) => {
                const cat = p.stats[statTab] as Record<string, number>;
                return (
                  <tr key={p.memberId} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td className="px-2 py-1.5 align-middle font-medium">{p.displayName}</td>
                    {fields.map((f) =>
                      f.derived ?
                        <td
                          key={f.key}
                          className="px-1 py-1 align-middle text-center text-xs text-zinc-500 tabular-nums"
                        >
                          {derivedStatValue(p.stats, f.derived)}
                        </td>
                      : (
                        <td key={f.key} className="px-1 py-1 align-middle">
                          <input
                            type="number"
                            min={0}
                            value={cat[f.key] ?? 0}
                            onChange={(e) => onUpdateStat(p.memberId, statTab, f.key, e.target.value)}
                            className="box-border w-full min-w-0 rounded border border-zinc-300 px-1 py-0.5 text-center tabular-nums dark:border-zinc-700 dark:bg-zinc-950"
                          />
                        </td>
                      ),
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 手機：球員列表，分類在 popup 內切換 */}
      <div className="space-y-2 md:hidden">
        <p className="text-xs text-zinc-500">點選球員，在 popup 內切換分類並輸入數據</p>
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {playerRows.map((p) => {
            const filled = hasAnyPlayerStats(p.stats);
            return (
              <li key={p.memberId}>
                <button
                  type="button"
                  onClick={() => openPlayerSheet(p)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{p.displayName}</p>
                    <p className={`mt-0.5 line-clamp-2 text-xs ${filled ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400"}`}>
                      {playerOverallSummary(p.stats)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-[var(--brand-primary)]">
                    {filled ? "編輯" : "填寫"}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <BottomSheet
        open={sheetPlayer !== null}
        onClose={closePlayerSheet}
        title={sheetPlayer?.displayName ?? ""}
        subtitle="個人數據 · 切換上方分類"
        tall
        footer={
          <button
            type="button"
            onClick={closePlayerSheet}
            className="w-full rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            完成
          </button>
        }
      >
        {sheetPlayer ?
          <PlayerStatSheetForm
            player={sheetPlayer}
            category={sheetCategory}
            onCategoryChange={setSheetCategory}
            onUpdateStat={onUpdateStat}
          />
        : null}
      </BottomSheet>
    </div>
  );
}
