"use client";

import { useMemo, useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  FITNESS_TEST_ITEMS,
  FITNESS_TEST_ITEM_BY_KEY,
  formatFitnessUnit,
  formatFitnessValue,
  type FitnessTestItemKey,
  type FitnessTestPlayerRow,
  type FitnessTestStats,
} from "@/lib/fitness/test-schema";
import {
  formatDecimalFieldValue,
  parseDecimalOrNull,
  sanitizeDecimalInput,
} from "@/lib/numeric-input";

type Props = {
  playerRows: FitnessTestPlayerRow[];
  onUpdateAttempt: (memberId: string, itemKey: FitnessTestItemKey, attemptIndex: number, value: string) => void;
};

function ItemTabs({
  active,
  onChange,
}: {
  active: FitnessTestItemKey;
  onChange: (key: FitnessTestItemKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {FITNESS_TEST_ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            active === item.key ?
              "bg-[var(--brand-primary)] text-white"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

/** BottomSheet 內：切換 6 項測試並填 attempts。 */
function PlayerFitnessSheetForm({
  player,
  itemKey,
  onItemChange,
  onUpdateAttempt,
}: {
  player: FitnessTestPlayerRow;
  itemKey: FitnessTestItemKey;
  onItemChange: (key: FitnessTestItemKey) => void;
  onUpdateAttempt: Props["onUpdateAttempt"];
}) {
  const def = FITNESS_TEST_ITEM_BY_KEY[itemKey];
  const item = player.stats[itemKey];

  return (
    <div className="space-y-4">
      <ItemTabs active={itemKey} onChange={onItemChange} />
      <div className="space-y-3 pt-1">
        {Array.from({ length: def.attemptCount }, (_, i) => (
          <label key={i} className="block">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {def.attemptCount === 1 ? "成績" : `第 ${i + 1} 次`}
              {def.unit === "sec" ? "（秒）" : def.unit === "cm" ? "（cm）" : "（m）"}
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={formatDecimalFieldValue(item.attempts[i], def.decimalPlaces)}
              placeholder="—"
              onChange={(e) =>
                onUpdateAttempt(
                  player.memberId,
                  itemKey,
                  i,
                  sanitizeDecimalInput(e.target.value, def.decimalPlaces),
                )
              }
              className="mt-1 box-border w-full rounded-lg border border-zinc-300 px-3 py-2 tabular-nums dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
        ))}
        <div className="rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {def.higherIsBetter ? "最佳" : "成績"}
          </span>
          <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatFitnessValue(item.best, def.decimalPlaces)}
            {item.best != null ? formatFitnessUnit(def.unit) : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

/** 教練：逐人填寫體能測試（註解：手機 BottomSheet + 桌面表格）。 */
export function FitnessTestInputSection({ playerRows, onUpdateAttempt }: Props) {
  const [sheetMemberId, setSheetMemberId] = useState<string | null>(null);
  const [sheetItemKey, setSheetItemKey] = useState<FitnessTestItemKey>("squatJump");
  const [mobileFilter, setMobileFilter] = useState<"todo" | "done" | "all">("all");
  const [mobileQuery, setMobileQuery] = useState("");

  const sheetPlayer = playerRows.find((p) => p.memberId === sheetMemberId) ?? null;

  const mobileRows = useMemo(() => {
    const q = mobileQuery.trim().toLowerCase();
    return playerRows.filter((p) => {
      const filled = p.stats.squatJump.best != null ||
        p.stats.cmj.best != null ||
        p.stats.approachJump.best != null ||
        p.stats.depthJump.best != null ||
        p.stats.courtShuttle.best != null ||
        p.stats.medicineBallThrow.best != null;
      if (mobileFilter === "todo" && filled) return false;
      if (mobileFilter === "done" && !filled) return false;
      if (q && !p.displayName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mobileFilter, mobileQuery, playerRows]);

  const mobileDoneCount = playerRows.filter((p) =>
    FITNESS_TEST_ITEMS.some((item) => p.stats[item.key].best != null),
  ).length;

  function openPlayerSheet(player: FitnessTestPlayerRow) {
    setSheetMemberId(player.memberId);
    setSheetItemKey("squatJump");
  }

  return (
    <div className="space-y-4">
      {/* 桌面：簡表 */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <th className="px-2 py-2 font-medium">隊員</th>
              {FITNESS_TEST_ITEMS.map((item) => (
                <th key={item.key} className="px-2 py-2 font-medium">
                  {item.label}
                </th>
              ))}
              <th className="px-2 py-2 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {playerRows.map((p) => (
              <tr key={p.memberId} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-2 py-2 font-medium text-zinc-900 dark:text-zinc-50">{p.displayName}</td>
                {FITNESS_TEST_ITEMS.map((item) => (
                  <td key={item.key} className="px-2 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">
                    {formatFitnessValue(p.stats[item.key].best, item.decimalPlaces)}
                    {p.stats[item.key].best != null ? formatFitnessUnit(item.unit) : ""}
                  </td>
                ))}
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => openPlayerSheet(p)}
                    className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
                  >
                    填寫
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 手機：列表 + BottomSheet */}
      <div className="space-y-2 md:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-zinc-500">點選球員，在 popup 內切換測試項目</p>
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
            const filled = FITNESS_TEST_ITEMS.some((item) => p.stats[item.key].best != null);
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
                      {filled ?
                        FITNESS_TEST_ITEMS.filter((item) => p.stats[item.key].best != null)
                          .map((item) => `${item.label} ${formatFitnessValue(p.stats[item.key].best, item.decimalPlaces)}`)
                          .join(" · ")
                      : "尚未填寫"}
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
        onClose={() => setSheetMemberId(null)}
        title={sheetPlayer?.displayName ?? ""}
        subtitle="體能測試 · 切換上方項目"
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
          <PlayerFitnessSheetForm
            player={sheetPlayer}
            itemKey={sheetItemKey}
            onItemChange={setSheetItemKey}
            onUpdateAttempt={onUpdateAttempt}
          />
        : null}
      </BottomSheet>
    </div>
  );
}

/** 供 panel 使用的 attempt 更新 helper（註解：重新計算 best）。 */
export function applyFitnessAttemptUpdate(
  stats: FitnessTestStats,
  itemKey: FitnessTestItemKey,
  attemptIndex: number,
  raw: string,
): FitnessTestStats {
  const def = FITNESS_TEST_ITEM_BY_KEY[itemKey];
  const parsed = parseDecimalOrNull(raw, def.decimalPlaces);
  const nextAttempts = [...stats[itemKey].attempts];
  nextAttempts[attemptIndex] = parsed;
  const values = nextAttempts.filter((v): v is number => v != null);
  const best =
    values.length === 0 ? null
    : def.higherIsBetter ? Math.max(...values)
    : values[0] ?? null;
  return {
    ...stats,
    [itemKey]: {
      ...stats[itemKey],
      attempts: nextAttempts,
      best,
    },
  };
}
