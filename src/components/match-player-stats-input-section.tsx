"use client";

import { useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  CATEGORY_FIELDS,
  categorySummary,
  derivedStatValue,
} from "@/lib/match-player-stats-fields";
import { hasCategoryData, STAT_CATEGORIES, STAT_CATEGORY_LABELS, type MatchResultPlayerRow, type StatCategory } from "@/lib/match-result-schema";

type Props = {
  statTab: StatCategory;
  onStatTabChange: (tab: StatCategory) => void;
  playerRows: MatchResultPlayerRow[];
  onUpdateStat: (memberId: string, category: StatCategory, field: string, value: string) => void;
};

function parseDisplayInt(value: number): string {
  return value === 0 ? "" : String(value);
}

/** 手機 popup 內的單球員輸入表單。 */
function PlayerStatSheetForm({
  player,
  category,
  onUpdateStat,
}: {
  player: MatchResultPlayerRow;
  category: StatCategory;
  onUpdateStat: Props["onUpdateStat"];
}) {
  const fields = CATEGORY_FIELDS[category];
  const cat = player.stats[category] as Record<string, number>;

  return (
    <div className="space-y-4">
      {fields.map((f) =>
        f.derived ?
          <div key={f.key} className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950">
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
  );
}

/** 個人數據輸入：桌機表格 + 手機 popup（註解：避免橫向捲動列不全）。 */
export function MatchPlayerStatsInputSection({
  statTab,
  onStatTabChange,
  playerRows,
  onUpdateStat,
}: Props) {
  const [sheetPlayer, setSheetPlayer] = useState<MatchResultPlayerRow | null>(null);
  const fields = CATEGORY_FIELDS[statTab];

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">個人數據</h3>
      <div className="mb-3 flex flex-wrap gap-1">
        {STAT_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onStatTabChange(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statTab === c ?
                "bg-[var(--brand-primary)] text-white"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {STAT_CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      {/* 桌機：寬表格 */}
      <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 md:block dark:border-zinc-800">
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

      {/* 手機：球員列表 + popup 輸入 */}
      <div className="space-y-2 md:hidden">
        <p className="text-xs text-zinc-500">點選球員以輸入 {STAT_CATEGORY_LABELS[statTab]} 數據</p>
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {playerRows.map((p) => {
            const filled = hasCategoryData(p.stats, statTab);
            return (
              <li key={p.memberId}>
                <button
                  type="button"
                  onClick={() => setSheetPlayer(p)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-900 dark:active:bg-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{p.displayName}</p>
                    <p className={`mt-0.5 truncate text-xs ${filled ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-400"}`}>
                      {categorySummary(p.stats, statTab)}
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
        onClose={() => setSheetPlayer(null)}
        title={sheetPlayer?.displayName ?? ""}
        subtitle={`${STAT_CATEGORY_LABELS[statTab]} · 個人數據`}
        tall
        footer={
          <button
            type="button"
            onClick={() => setSheetPlayer(null)}
            className="w-full rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            完成
          </button>
        }
      >
        {sheetPlayer ?
          <PlayerStatSheetForm player={sheetPlayer} category={statTab} onUpdateStat={onUpdateStat} />
        : null}
      </BottomSheet>
    </div>
  );
}
