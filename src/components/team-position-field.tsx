"use client";

import { useState } from "react";

/** 位置欄位 UI 初始狀態（註解：不在清單內的舊資料走「其他（手填）」）。 */
export function derivePositionState(options: readonly string[], position: string | null) {
  const value = position?.trim() || "";
  if (!value) return { choice: "", custom: "" };
  if (options.includes(value)) return { choice: value, custom: "" };
  return { choice: "__custom", custom: value };
}

/** 由下拉／手填狀態解析要送出的位置（註解：空字串表示不指定）。 */
export function resolvePositionValue(choice: string, custom: string): string | null {
  if (choice === "__custom") return custom.trim() || null;
  return choice.trim() || null;
}

type Props = {
  id?: string;
  options: readonly string[];
  label?: string;
  /** 選填欄位標籤後綴（註解：新增表單用「（選填）」）。 */
  optionalSuffix?: boolean;
  className?: string;
  onChoiceChange?: (choice: string) => void;
  onCustomChange?: (custom: string) => void;
  choice: string;
  custom: string;
};

/** 隊員位置：下拉選單 + 其他手填（註解：與分組欄位 UX 一致）。 */
export function TeamPositionField({
  id = "member-position",
  options,
  label = "位置",
  optionalSuffix = false,
  className,
  onChoiceChange,
  onCustomChange,
  choice,
  custom,
}: Props) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label}
        {optionalSuffix ? "（選填）" : null}
      </label>
      <select
        id={id}
        value={choice}
        onChange={(e) => onChoiceChange?.(e.target.value)}
        className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
      >
        <option value="">不指定</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value="__custom">其他（手填）</option>
      </select>
      {choice === "__custom" ?
        <input
          type="text"
          value={custom}
          onChange={(e) => onCustomChange?.(e.target.value)}
          maxLength={64}
          placeholder="自訂位置"
          className="mt-2 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          aria-label="自訂位置"
        />
      : null}
    </div>
  );
}

/** 位置欄位 state hook（註解：供表單 onSubmit 解析）。 */
export function useTeamPositionField(options: readonly string[], initialPosition?: string | null) {
  const init = derivePositionState(options, initialPosition ?? null);
  const [choice, setChoice] = useState(init.choice);
  const [custom, setCustom] = useState(init.custom);

  function reset(nextPosition?: string | null) {
    const next = derivePositionState(options, nextPosition ?? null);
    setChoice(next.choice);
    setCustom(next.custom);
  }

  return {
    choice,
    setChoice,
    custom,
    setCustom,
    reset,
    resolve: () => resolvePositionValue(choice, custom),
  };
}
