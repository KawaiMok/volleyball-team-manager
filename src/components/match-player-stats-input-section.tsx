"use client";

import { useMemo, useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useMatchModule } from "@/components/team-sport-provider";
import { formatNumericFieldValue } from "@/lib/numeric-input";
import type { MatchResultPlayerRow } from "@/lib/sports/match/types";

type Props = {
  playerRows: MatchResultPlayerRow[];
  onUpdateStat: (memberId: string, category: string, field: string, value: string) => void;
};

function CategoryTabs({
  categories,
  labels,
  active,
  onChange,
  className = "",
}: {
  categories: readonly string[];
  labels: Record<string, string>;
  active: string;
  onChange: (tab: string) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {categories.map((c) => (
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
          {labels[c] ?? c}
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
  category: string;
  onCategoryChange: (tab: string) => void;
  onUpdateStat: Props["onUpdateStat"];
}) {
  const match = useMatchModule();
  const fields = match.categoryFields[category] ?? [];
  const cat = player.stats[category] as Record<string, number>;

  return (
    <div className="space-y-4">
      <CategoryTabs
        categories={match.categories}
        labels={match.categoryLabels}
        active={category}
        onChange={onCategoryChange}
      />
      <div className="space-y-4 pt-1">
        {fields.map((f) =>
          f.derived ?
            <div
              key={f.key}
              className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950"
            >
              <span className="text-sm text-zinc-600 dark:text-zinc-400">{f.label}</span>
              <span className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                {match.derivedStatValue(player.stats, f.derived)}
              </span>
            </div>
          : (
            <label key={f.key} className="block space-y-1.5">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{f.label}</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formatNumericFieldValue(cat?.[f.key] ?? 0)}
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
  const match = useMatchModule();
  const [statTab, setStatTab] = useState<string>(match.categories[0]);
  const [sheetMemberId, setSheetMemberId] = useState<string | null>(null);
  const [sheetCategory, setSheetCategory] = useState<string>(match.categories[0]);
  const [tableExpanded, setTableExpanded] = useState(false);
  const fields = match.categoryFields[statTab] ?? [];
  const sheetPlayer =
    sheetMemberId ? playerRows.find((p) => p.memberId === sheetMemberId) ?? null : null;

  const [mobileFilter, setMobileFilter] = useState<"all" | "todo" | "done">("todo");
  const [mobileQuery, setMobileQuery] = useState("");

  const mobileRows = useMemo(() => {
    const q = mobileQuery.trim().toLowerCase();
    return playerRows.filter((p) => {
      const filled = match.hasAnyPlayerStats(p.stats);
      if (mobileFilter === "todo" && filled) return false;
      if (mobileFilter === "done" && !filled) return false;
      if (!q) return true;
      return p.displayName.toLowerCase().includes(q);
    });
  }, [playerRows, mobileFilter, mobileQuery, match]);

  const mobileDoneCount = useMemo(
    () => playerRows.filter((p) => match.hasAnyPlayerStats(p.stats)).length,
    [playerRows, match],
  );

  function openPlayerSheet(player: MatchResultPlayerRow) {
    const initial =
      match.categories.find((c) => match.hasCategoryData(player.stats, c)) ?? match.categories[0];
    setSheetCategory(initial);
    setSheetMemberId(player.memberId);
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">個人數據</h3>
        {playerRows.length >= 10 ?
          <button
            type="button"
            className="hidden text-xs text-[var(--brand-primary)] hover:underline md:inline"
            onClick={() => setTableExpanded((v) => !v)}
          >
            {tableExpanded ? "收合表格高度" : "展開表格高度"}
          </button>
        : null}
      </div>

      {/* 桌機 */}
      <div className="hidden md:block">
        <CategoryTabs
          categories={match.categories}
          labels={match.categoryLabels}
          active={statTab}
          onChange={setStatTab}
          className="mb-3"
        />
        <div
          className={[
            "overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800",
            tableExpanded ? "" : "max-h-[520px] overflow-y-auto",
          ].join(" ")}
        >
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[7rem]" />
              {fields.map((f) => (
                <col key={f.key} />
              ))}
            </colgroup>
            <thead className="sticky top-0 z-10 bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-950">
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
                          {match.derivedStatValue(p.stats, f.derived)}
                        </td>
                      : (
                        <td key={f.key} className="px-1 py-1 align-middle">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={formatNumericFieldValue(cat?.[f.key] ?? 0)}
                            placeholder="0"
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

      {/* 手機 */}
      <div className="space-y-2 md:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">點選球員，在 popup 內切換分類並輸入數據</p>
          <p className="text-xs text-zinc-500">
            已填 {mobileDoneCount}/{playerRows.length}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-full bg-zinc-100 p-1 text-xs dark:bg-zinc-800">
            {(["todo", "done", "all"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setMobileFilter(f)}
                className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
                  mobileFilter === f ?
                    "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                  : "text-zinc-600 dark:text-zinc-300"
                }`}
              >
                {f === "todo" ? "未填" : f === "done" ? "已填" : "全部"}
              </button>
            ))}
          </div>
          <input
            value={mobileQuery}
            onChange={(e) => setMobileQuery(e.target.value)}
            placeholder="搜尋球員"
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </div>

        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {mobileRows.map((p) => {
            const filled = match.hasAnyPlayerStats(p.stats);
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
                      {match.playerOverallSummary(p.stats)}
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
        {mobileRows.length === 0 ?
          <p className="text-xs text-zinc-500">沒有符合條件的球員。</p>
        : null}
      </div>

      <BottomSheet
        open={sheetPlayer !== null}
        onClose={() => setSheetMemberId(null)}
        title={sheetPlayer?.displayName ?? ""}
        subtitle="個人數據 · 切換上方分類"
        tall
        footer={
          <button
            type="button"
            onClick={() => setSheetMemberId(null)}
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
