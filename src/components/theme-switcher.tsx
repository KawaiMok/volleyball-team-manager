"use client";

import { useEffect, useState } from "react";

import {
  type ThemePreference,
  getThemePreference,
  setThemePreference,
  subscribeThemePreference,
} from "@/lib/theme-preference";

type Variant = "coach" | "player";

const options: { value: ThemePreference; label: string; title: string }[] = [
  { value: "system", label: "系統", title: "跟隨系統／瀏覽器外觀" },
  { value: "light", label: "淺", title: "淺色" },
  { value: "dark", label: "深", title: "深色" },
];

type Props = {
  /** 註解：教練 zinc／球員 slate，與各端 toolbar 一致。 */
  variant: Variant;
};

/**
 * 外觀切換：系統／淺色／深色（註解：寫入 localStorage，html 加減 `dark` class）。
 */
export function ThemeSwitcher({ variant }: Props) {
  const [pref, setPref] = useState<ThemePreference>("system");

  useEffect(() => {
    setPref(getThemePreference());
    return subscribeThemePreference(() => {
      setPref(getThemePreference());
    });
  }, []);

  const wrap =
    variant === "coach" ?
      "inline-flex shrink-0 items-center rounded-lg border border-zinc-200 bg-zinc-100/90 p-0.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80"
    : "inline-flex shrink-0 items-center rounded-lg border border-slate-200 bg-slate-100/90 p-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-800/80";

  const active =
    variant === "coach" ?
      "rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
    : "rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white shadow-sm dark:bg-slate-100 dark:text-slate-900";

  const idle =
    variant === "coach" ?
      "rounded-md px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-white/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700/50 dark:hover:text-zinc-50"
    : "rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-slate-50";

  return (
    <div className={wrap} role="group" aria-label="外觀（淺／深／系統）">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.title}
          className={pref === o.value ? active : idle}
          aria-pressed={pref === o.value}
          onClick={() => setThemePreference(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
