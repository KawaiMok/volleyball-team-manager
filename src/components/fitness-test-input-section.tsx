"use client";

import { useMemo, useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  FITNESS_HEIGHT_DECIMAL_PLACES,
  FITNESS_TEST_ITEM_BY_KEY,
  FITNESS_WEIGHT_DECIMAL_PLACES,
  formatBodyMetric,
  formatFitnessUnit,
  formatFitnessValue,
  hasAnyFitnessResultRow,
  normalizeFitnessStats,
  resolveFitnessTestItems,
  type FitnessTestItemKey,
  type FitnessTestPlayerRow,
  type FitnessTestStats,
} from "@/lib/fitness/test-schema";
import {
  formatDecimalDraftValue,
  formatDecimalFieldValue,
  parseDecimalOrNull,
  sanitizeDecimalInput,
} from "@/lib/numeric-input";

type Props = {
  playerRows: FitnessTestPlayerRow[];
  onUpdateAttempt: (memberId: string, itemKey: FitnessTestItemKey, attemptIndex: number, value: string) => void;
  onUpdateBodyMetric: (memberId: string, field: "heightCm" | "weightKg", value: string) => void;
  /** 球員 popup「完成」：儲存該員並回傳是否成功。 */
  onSavePlayer: (memberId: string) => Promise<boolean>;
  /** 球員 popup「取消」：還原開啟 popup 當下的資料。 */
  onRevertPlayer: (snapshot: FitnessTestPlayerRow) => void;
  savingMemberId: string | null;
  /** 本場所選測試項目（註解：僅顯示／填寫這些項目）。 */
  selectedItemKeys: FitnessTestItemKey[];
};

type FitnessItemDef = ReturnType<typeof resolveFitnessTestItems>[number];

function ItemTabs({
  items,
  active,
  onChange,
}: {
  items: readonly FitnessItemDef[];
  active: FitnessTestItemKey;
  onChange: (key: FitnessTestItemKey) => void;
}) {
  return (
    <div className="hidden flex-wrap gap-1.5 md:flex">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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

/** 手機：大按鈕 + 左右切換 + 展開選單（註解：取代難按的藥丸 tabs）。 */
function FitnessItemSwitcher({
  items,
  active,
  onChange,
}: {
  items: readonly FitnessItemDef[];
  active: FitnessTestItemKey;
  onChange: (key: FitnessTestItemKey) => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const activeIndex = items.findIndex((item) => item.key === active);
  const activeDef = FITNESS_TEST_ITEM_BY_KEY[active];
  const canPrev = activeIndex > 0;
  const canNext = activeIndex >= 0 && activeIndex < items.length - 1;

  function goPrev() {
    if (!canPrev) return;
    onChange(items[activeIndex - 1]!.key);
  }

  function goNext() {
    if (!canNext) return;
    onChange(items[activeIndex + 1]!.key);
  }

  const navBtnBase =
    "flex h-12 w-14 shrink-0 items-center justify-center rounded-xl border-2 text-2xl font-bold transition active:scale-[0.97]";
  const navBtnEnabled =
    "border-[var(--brand-primary)]/50 bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] shadow-sm active:bg-[var(--brand-primary)]/25 dark:bg-[var(--brand-primary)]/20";
  const navBtnDisabled =
    "border-zinc-200 bg-zinc-100 text-zinc-300 opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-600";

  return (
    <div className="space-y-2 md:hidden">
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          aria-label="上一項"
          disabled={!canPrev}
          onClick={goPrev}
          className={`${navBtnBase} ${canPrev ? navBtnEnabled : navBtnDisabled}`}
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-left dark:border-zinc-700 dark:bg-zinc-950"
          aria-expanded={pickerOpen}
        >
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">
              {activeDef.label}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {activeIndex + 1}/{items.length} · 點選展開
            </span>
          </span>
          <span className="shrink-0 text-zinc-400" aria-hidden>
            {pickerOpen ? "▴" : "▾"}
          </span>
        </button>
        <button
          type="button"
          aria-label="下一項"
          disabled={!canNext}
          onClick={goNext}
          className={`${navBtnBase} ${canNext ? navBtnEnabled : navBtnDisabled}`}
        >
          ›
        </button>
      </div>

      {pickerOpen ?
        <ul className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
          {items.map((item) => {
            const selected = item.key === active;
            return (
              <li key={item.key} className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    onChange(item.key);
                    setPickerOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-4 py-3.5 text-left text-sm ${
                    selected ?
                      "bg-[var(--brand-primary)]/10 font-semibold text-[var(--brand-primary)]"
                    : "text-zinc-800 active:bg-zinc-50 dark:text-zinc-100 dark:active:bg-zinc-900"
                  }`}
                >
                  <span>{item.label}</span>
                  {selected ?
                    <span className="text-xs">目前</span>
                  : null}
                </button>
              </li>
            );
          })}
        </ul>
      : null}
    </div>
  );
}

/** 單次嘗試輸入（註解：focus 期間保留 draft，避免 4→4.0 擋住輸入 42）。 */
function FitnessAttemptInput({
  fieldKey,
  attemptValue,
  decimalPlaces,
  label,
  onUpdateAttempt,
  size = "default",
}: {
  fieldKey: string;
  attemptValue: number | null;
  decimalPlaces: number;
  label: string;
  onUpdateAttempt: (raw: string) => void;
  size?: "default" | "compact";
}) {
  const [draft, setDraft] = useState<{ key: string; value: string } | null>(null);
  const display =
    draft?.key === fieldKey ? draft.value : formatDecimalFieldValue(attemptValue, decimalPlaces);
  const compact = size === "compact";

  return (
    <label className={compact ? "block min-w-0" : "block"}>
      {label ?
        <span
          className={
            compact ?
              "text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
            : "text-sm text-zinc-600 dark:text-zinc-400"
          }
        >
          {label}
        </span>
      : null}
      <input
        type="text"
        inputMode="decimal"
        value={display}
        placeholder="—"
        onFocus={() => {
          setDraft({
            key: fieldKey,
            value: formatDecimalDraftValue(attemptValue, decimalPlaces),
          });
        }}
        onBlur={() => {
          setDraft((prev) => (prev?.key === fieldKey ? null : prev));
        }}
        onChange={(e) => {
          const next = sanitizeDecimalInput(e.target.value, decimalPlaces);
          setDraft({ key: fieldKey, value: next });
          onUpdateAttempt(next);
        }}
        className={`box-border w-full rounded-lg border border-zinc-300 tabular-nums dark:border-zinc-700 dark:bg-zinc-950 ${
          compact ?
            "mt-0.5 px-2 py-1.5 text-sm"
          : "px-3 py-2"
        } ${label && !compact ? "mt-1" : ""}`}
      />
    </label>
  );
}

/** 身高／體重輸入（註解：popup 內用 inline 單列，節省空間）。 */
function FitnessBodyMetricFields({
  player,
  onUpdateBodyMetric,
}: {
  player: FitnessTestPlayerRow;
  onUpdateBodyMetric: Props["onUpdateBodyMetric"];
}) {
  return (
    <div className="flex items-end gap-3 border-b border-zinc-100 pb-3 dark:border-zinc-800">
      <div className="flex min-w-0 flex-1 items-end gap-1.5">
        <div className="min-w-0 flex-1">
          <FitnessAttemptInput
            fieldKey={`${player.memberId}:heightCm`}
            attemptValue={player.heightCm}
            decimalPlaces={FITNESS_HEIGHT_DECIMAL_PLACES}
            label="身高"
            size="compact"
            onUpdateAttempt={(raw) => onUpdateBodyMetric(player.memberId, "heightCm", raw)}
          />
        </div>
        <span className="pb-2 text-xs text-zinc-400">cm</span>
      </div>
      <div className="flex min-w-0 flex-1 items-end gap-1.5">
        <div className="min-w-0 flex-1">
          <FitnessAttemptInput
            fieldKey={`${player.memberId}:weightKg`}
            attemptValue={player.weightKg}
            decimalPlaces={FITNESS_WEIGHT_DECIMAL_PLACES}
            label="體重"
            size="compact"
            onUpdateAttempt={(raw) => onUpdateBodyMetric(player.memberId, "weightKg", raw)}
          />
        </div>
        <span className="pb-2 text-xs text-zinc-400">kg</span>
      </div>
    </div>
  );
}

/** BottomSheet 內：切換所選測試並填 attempts。 */
function PlayerFitnessSheetForm({
  items,
  player,
  itemKey,
  onItemChange,
  onUpdateAttempt,
  onUpdateBodyMetric,
}: {
  items: readonly FitnessItemDef[];
  player: FitnessTestPlayerRow;
  itemKey: FitnessTestItemKey;
  onItemChange: (key: FitnessTestItemKey) => void;
  onUpdateAttempt: Props["onUpdateAttempt"];
  onUpdateBodyMetric: Props["onUpdateBodyMetric"];
}) {
  const def = FITNESS_TEST_ITEM_BY_KEY[itemKey];
  const item = player.stats[itemKey];

  return (
    <div className="space-y-4">
      <FitnessBodyMetricFields player={player} onUpdateBodyMetric={onUpdateBodyMetric} />
      <FitnessItemSwitcher items={items} active={itemKey} onChange={onItemChange} />
      <ItemTabs items={items} active={itemKey} onChange={onItemChange} />
      <div className="space-y-3 pt-1">
        {Array.from({ length: def.attemptCount }, (_, i) => {
          const unitSuffix =
            def.unit === "sec" ? "（秒）" : def.unit === "cm" ? "（cm）" : "（m）";
          const attemptLabel =
            def.attemptCount === 1 ? `成績${unitSuffix}` : `第 ${i + 1} 次${unitSuffix}`;
          return (
            <FitnessAttemptInput
              key={i}
              fieldKey={`${player.memberId}:${itemKey}:${i}`}
              attemptValue={item.attempts[i] ?? null}
              decimalPlaces={def.decimalPlaces}
              label={attemptLabel}
              onUpdateAttempt={(raw) => onUpdateAttempt(player.memberId, itemKey, i, raw)}
            />
          );
        })}
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
export function FitnessTestInputSection({
  playerRows,
  onUpdateAttempt,
  onUpdateBodyMetric,
  onSavePlayer,
  onRevertPlayer,
  savingMemberId,
  selectedItemKeys,
}: Props) {
  const items = useMemo(() => resolveFitnessTestItems(selectedItemKeys), [selectedItemKeys]);
  const defaultItemKey = items[0]?.key ?? "squatJump";
  const [sheetMemberId, setSheetMemberId] = useState<string | null>(null);
  const [sheetSnapshot, setSheetSnapshot] = useState<FitnessTestPlayerRow | null>(null);
  const [sheetItemKey, setSheetItemKey] = useState<FitnessTestItemKey>(defaultItemKey);
  const [mobileFilter, setMobileFilter] = useState<"todo" | "done" | "all">("all");
  const [mobileQuery, setMobileQuery] = useState("");

  const sheetPlayer = playerRows.find((p) => p.memberId === sheetMemberId) ?? null;
  const sheetSaving = sheetMemberId != null && savingMemberId === sheetMemberId;

  const mobileRows = useMemo(() => {
    const q = mobileQuery.trim().toLowerCase();
    return playerRows.filter((p) => {
      const filled = hasAnyFitnessResultRow(p, selectedItemKeys);
      if (mobileFilter === "todo" && filled) return false;
      if (mobileFilter === "done" && !filled) return false;
      if (q && !p.displayName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [mobileFilter, mobileQuery, playerRows, selectedItemKeys]);

  const mobileDoneCount = playerRows.filter((p) => hasAnyFitnessResultRow(p, selectedItemKeys)).length;

  function openPlayerSheet(player: FitnessTestPlayerRow) {
    setSheetSnapshot({
      ...player,
      stats: normalizeFitnessStats(player.stats),
    });
    setSheetMemberId(player.memberId);
    setSheetItemKey(defaultItemKey);
  }

  function closePlayerSheet() {
    setSheetMemberId(null);
    setSheetSnapshot(null);
  }

  function handleCancelSheet() {
    if (sheetSnapshot) {
      onRevertPlayer(sheetSnapshot);
    }
    closePlayerSheet();
  }

  async function handleCompleteSheet() {
    if (!sheetMemberId || sheetSaving) return;
    const ok = await onSavePlayer(sheetMemberId);
    if (ok) {
      closePlayerSheet();
    }
  }

  return (
    <div className="space-y-4">
      {/* 桌面：簡表 */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
              <th className="px-2 py-2 font-medium">隊員</th>
              <th className="px-2 py-2 font-medium">身高</th>
              <th className="px-2 py-2 font-medium">體重</th>
              {items.map((item) => (
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
                <td className="px-2 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatBodyMetric(p.heightCm, "cm")}
                </td>
                <td className="px-2 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">
                  {formatBodyMetric(p.weightKg, "kg")}
                </td>
                {items.map((item) => (
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
                    {hasAnyFitnessResultRow(p, selectedItemKeys) ? "編輯" : "填寫"}
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
          <p className="text-xs text-zinc-500">點選球員，用下方切換器選測試項目</p>
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
            const filled = hasAnyFitnessResultRow(p, selectedItemKeys);
            const metricParts = [
              p.heightCm != null ? `身高 ${p.heightCm}cm` : null,
              p.weightKg != null ? `體重 ${p.weightKg}kg` : null,
            ].filter(Boolean);
            const testParts = items
              .filter((item) => p.stats[item.key].best != null)
              .map((item) => `${item.label} ${formatFitnessValue(p.stats[item.key].best, item.decimalPlaces)}`);
            const summary = [...metricParts, ...testParts].join(" · ");
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
                      {filled ? summary : "尚未填寫"}
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
        onClose={handleCancelSheet}
        title={sheetPlayer?.displayName ?? ""}
        subtitle="體能測試 · 身高／體重與各項成績"
        tall
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              disabled={sheetSaving}
              onClick={handleCancelSheet}
              className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              取消
            </button>
            <button
              type="button"
              disabled={sheetSaving}
              onClick={() => void handleCompleteSheet()}
              className="flex-1 rounded-lg bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {sheetSaving ? "儲存中…" : "完成"}
            </button>
          </div>
        }
      >
        {sheetPlayer ?
          <PlayerFitnessSheetForm
            items={items}
            player={sheetPlayer}
            itemKey={sheetItemKey}
            onItemChange={setSheetItemKey}
            onUpdateAttempt={onUpdateAttempt}
            onUpdateBodyMetric={onUpdateBodyMetric}
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
