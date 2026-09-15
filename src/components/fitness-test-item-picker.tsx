"use client";

import {
  DEFAULT_FITNESS_TEST_ITEM_KEYS,
  FITNESS_TEST_ITEMS,
  type FitnessTestItemKey,
} from "@/lib/fitness/test-schema";

type Props = {
  value: FitnessTestItemKey[];
  onChange: (keys: FitnessTestItemKey[]) => void;
  disabled?: boolean;
};

/** 建立／編輯體能測試事件時選擇進行項目（註解：至少須選 1 項）。 */
export function FitnessTestItemPicker({ value, onChange, disabled }: Props) {
  const selected = new Set(value);

  function toggle(key: FitnessTestItemKey) {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(key)) {
      if (next.size <= 1) return;
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(DEFAULT_FITNESS_TEST_ITEM_KEYS.filter((k) => next.has(k)));
  }

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">測試項目</legend>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">勾選本場要進行的測試，至少選一項。</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {FITNESS_TEST_ITEMS.map((item) => {
          const checked = selected.has(item.key);
          const isLast = checked && selected.size === 1;
          return (
            <label
              key={item.key}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                checked ?
                  "border-[var(--brand-primary)] bg-[var(--brand-primary)]/5"
                : "border-zinc-200 dark:border-zinc-700"
              } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled || isLast}
                onChange={() => toggle(item.key)}
                className="rounded border-zinc-300"
              />
              <span className="text-zinc-800 dark:text-zinc-200">{item.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
