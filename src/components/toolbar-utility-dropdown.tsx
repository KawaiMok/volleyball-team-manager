"use client";

import { useEffect, useRef, useState } from "react";

import { CoachPlayerViewSwitch } from "@/components/coach-player-view-switch";
import { DataViewModeToggle } from "@/components/data-view-mode-toggle";
import { ThemeSwitcher } from "@/components/theme-switcher";

type Surface = "coach" | "player";

type Props = {
  /** 註解：教練 zinc／球員 slate，與各端 header 一致。 */
  surface: Surface;
  /** 註解：目前所在端（高亮 `CoachPlayerViewSwitch`）。 */
  currentView: "coach" | "player";
  /**
   * 註解：是否可切到教練端。
   * 教練列固定 true；球員列傳 `isCoachLike(member)`，純球員僅顯示「外觀」區塊。
   */
  canAccessCoach: boolean;
};

/**
 * 教練／球員頂列：齒輪下拉，收合「端別」與「外觀（系統／淺／深）」。
 */
export function ToolbarUtilityDropdown({ surface, currentView, canAccessCoach }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const coachSwitch = surface === "coach";
  const showViewSection = coachSwitch || canAccessCoach;
  const switchCanAccess = coachSwitch ? true : canAccessCoach;
  const switchVariant = surface;

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      window.addEventListener("keydown", onEsc);
      return () => window.removeEventListener("keydown", onEsc);
    }
  }, [open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [open]);

  const btnOpen =
    surface === "coach"
      ? "border-zinc-400 bg-zinc-100 text-zinc-900 dark:border-zinc-500 dark:bg-zinc-800 dark:text-zinc-50"
      : "border-slate-400 bg-slate-100 text-slate-900 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-50";

  const btnIdle =
    surface === "coach"
      ? "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

  const focusRing =
    surface === "coach"
      ? "focus-visible:outline-zinc-400 dark:focus-visible:outline-zinc-500"
      : "focus-visible:outline-slate-400 dark:focus-visible:outline-slate-500";

  const panel =
    surface === "coach"
      ? "border-zinc-200 bg-white ring-black/5 dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/10"
      : "border-slate-200 bg-white ring-black/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10";

  const labelMuted =
    surface === "coach"
      ? "text-zinc-500 dark:text-zinc-400"
      : "text-slate-500 dark:text-slate-400";

  const sep =
    surface === "coach"
      ? "border-zinc-100 dark:border-zinc-800"
      : "border-slate-100 dark:border-slate-800";

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border text-lg leading-none shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${focusRing} ${
          open ? btnOpen : btnIdle
        }`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="顯示與端別設定"
        onClick={() => setOpen((o) => !o)}
      >
        {/** 僅齒輪圖示（註解：無障礙靠 aria-label）。 */}
        <span aria-hidden>⚙</span>
      </button>

      {open ?
        <div
          className={`absolute right-0 top-[calc(100%+0.375rem)] z-[60] w-[min(calc(100vw-2rem),20rem)] rounded-xl border p-3 shadow-lg ring-1 ${panel}`}
          role="menu"
          aria-label="顯示與端別"
        >
          <div className="space-y-4">
            {showViewSection ?
              <div>
                <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${labelMuted}`}>端別</p>
                <div className="flex justify-stretch">
                  <CoachPlayerViewSwitch
                    current={currentView}
                    canAccessCoach={switchCanAccess}
                    variant={switchVariant}
                    onNavigate={() => setOpen(false)}
                  />
                </div>
              </div>
            : null}
            <div className={showViewSection ? `border-t pt-3 ${sep}` : ""}>
              <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${labelMuted}`}>
                數據檢視
              </p>
              <DataViewModeToggle variant={surface} />
            </div>
            <div className={`border-t pt-3 ${sep}`}>
              <p className={`mb-2 text-[11px] font-semibold uppercase tracking-wide ${labelMuted}`}>外觀</p>
              <ThemeSwitcher variant={surface} />
            </div>
          </div>
        </div>
      : null}
    </div>
  );
}
