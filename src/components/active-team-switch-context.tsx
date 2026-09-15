"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { AppLogo } from "@/components/brand/app-logo";
import { useCapacitorNative } from "@/hooks/use-capacitor-native";

type SwitchState = {
  active: boolean;
  targetTeamId: string | null;
  label: string | null;
};

type ActiveTeamSwitchContextValue = {
  beginSwitch: (targetTeamId: string, label: string) => void;
  cancelSwitch: () => void;
};

const ActiveTeamSwitchContext = createContext<ActiveTeamSwitchContextValue | null>(null);

const SWITCH_TIMEOUT_MS = 45_000;

/** 讀取隊伍切換 context（註解：未包 Provider 時為 null）。 */
export function useActiveTeamSwitch() {
  return useContext(ActiveTeamSwitchContext);
}

type ProviderProps = {
  currentTeamId: string;
  variant: "coach" | "player";
  children: ReactNode;
};

/** 隊伍切換狀態：切換完成後依 currentTeamId 自動關閉 overlay。 */
export function ActiveTeamSwitchProvider({ currentTeamId, variant, children }: ProviderProps) {
  const [state, setState] = useState<SwitchState>({
    active: false,
    targetTeamId: null,
    label: null,
  });

  useEffect(() => {
    if (state.active && state.targetTeamId === currentTeamId) {
      setState({ active: false, targetTeamId: null, label: null });
    }
  }, [currentTeamId, state.active, state.targetTeamId]);

  useEffect(() => {
    if (!state.active) return;
    const timer = window.setTimeout(() => {
      setState({ active: false, targetTeamId: null, label: null });
    }, SWITCH_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [state.active, state.targetTeamId]);

  const beginSwitch = useCallback((targetTeamId: string, label: string) => {
    setState({ active: true, targetTeamId, label });
  }, []);

  const cancelSwitch = useCallback(() => {
    setState({ active: false, targetTeamId: null, label: null });
  }, []);

  return (
    <ActiveTeamSwitchContext.Provider value={{ beginSwitch, cancelSwitch }}>
      {children}
      {state.active ?
        <ActiveTeamSwitchOverlay variant={variant} teamLabel={state.label} />
      : null}
    </ActiveTeamSwitchContext.Provider>
  );
}

/** 切換隊伍全屏 loading（註解：覆蓋舊內容直到新隊資料載入完成）。 */
function ActiveTeamSwitchOverlay({
  variant,
  teamLabel,
}: {
  variant: "coach" | "player";
  teamLabel: string | null;
}) {
  const native = useCapacitorNative();
  const muted =
    variant === "coach" ? "text-zinc-500 dark:text-zinc-400" : "text-slate-500 dark:text-slate-400";

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[var(--app-page-bg)] px-6"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      {native ?
        <div
          className="native-loading-bar pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top,0px)] z-[201] h-0.5 bg-[var(--brand-primary)]"
          aria-hidden
        />
      : null}
      <AppLogo variant="mascot" size={72} animated />
      <p className={`mt-6 text-center text-base font-semibold text-[var(--app-text)]`}>
        正在切換隊伍…
      </p>
      {teamLabel ?
        <p className={`mt-2 max-w-sm text-center text-sm ${muted}`}>{teamLabel}</p>
      : null}
      <p className={`mt-4 text-center text-xs ${muted}`}>載入該隊資料中，請稍候</p>
    </div>
  );
}
