"use client";

import { useEffect, useState } from "react";

import { CIYOU } from "@/lib/ciyou-colors";
import {
  type ThemePreference,
  getThemePreference,
  isCiyouTheme,
  setThemePreference,
  subscribeThemePreference,
} from "@/lib/theme-preference";

type Variant = "coach" | "player";

const options: { value: ThemePreference; label: string; title: string }[] = [
  { value: "system", label: "系統", title: "跟隨系統／瀏覽器外觀" },
  { value: "light", label: "淺", title: "淺色" },
  { value: "dark", label: "深", title: "深色" },
  { value: "ciyou", label: "慈幼藍", title: "慈幼藍品牌色系（logo 皇家藍 + 圖騰紅）" },
];

type Props = {
  /** 註解：教練 zinc／球員 slate；慈幼藍時統一品牌色。 */
  variant: Variant;
};

/**
 * 外觀切換：系統／淺／深／慈幼藍（註解：寫入 localStorage，html class 由 ThemeProvider 同步）。
 */
export function ThemeSwitcher({ variant }: Props) {
  const [pref, setPref] = useState<ThemePreference>("system");

  useEffect(() => {
    setPref(getThemePreference());
    return subscribeThemePreference(() => {
      setPref(getThemePreference());
    });
  }, []);

  const ciyou = isCiyouTheme(pref);

  const wrap =
    ciyou ?
      "inline-flex shrink-0 flex-wrap items-center gap-0.5 rounded-lg border p-0.5 shadow-sm"
    : variant === "coach" ?
      "inline-flex shrink-0 flex-wrap items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-100/90 p-0.5 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/80"
    : "inline-flex shrink-0 flex-wrap items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-100/90 p-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-800/80";

  const wrapStyle = ciyou ? { borderColor: CIYOU.border, backgroundColor: CIYOU.groupedBg } : undefined;

  function btnClass(active: boolean) {
    if (active && ciyou) {
      return "rounded-md px-2 py-1 text-[11px] font-semibold text-white shadow-sm";
    }
    if (active) {
      return variant === "coach" ?
          "rounded-md bg-zinc-900 px-2 py-1 text-[11px] font-semibold text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900"
        : "rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white shadow-sm dark:bg-slate-100 dark:text-slate-900";
    }
    if (ciyou) {
      return "rounded-md px-2 py-1 text-[11px] font-medium hover:bg-white/80";
    }
    return variant === "coach" ?
        "rounded-md px-2 py-1 text-[11px] font-medium text-zinc-600 hover:bg-white/80 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-700/50 dark:hover:text-zinc-50"
      : "rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:text-slate-50";
  }

  return (
    <div className={wrap} style={wrapStyle} role="group" aria-label="外觀">
      {options.map((o) => {
        const active = pref === o.value;
        return (
          <button
            key={o.value}
            type="button"
            title={o.title}
            className={btnClass(active)}
            style={
              active && o.value === "ciyou" ?
                { backgroundColor: CIYOU.primary }
              : active && ciyou ?
                { backgroundColor: CIYOU.primary, color: "#fff" }
              : ciyou ?
                { color: CIYOU.textMuted }
              : undefined
            }
            aria-pressed={active}
            onClick={() => setThemePreference(o.value)}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
