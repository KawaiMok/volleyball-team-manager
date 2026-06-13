"use client";

import { createContext, useContext, type ReactNode } from "react";

import { getSportModule } from "@/lib/sports/registry";
import type { SportMatchClientModule } from "@/lib/sports/match/types";
import type { SportId } from "@/lib/sports/sport-id";
import type { SportModule } from "@/lib/sports/types";

const TeamSportContext = createContext<SportModule | null>(null);

type Props = {
  sport: SportId;
  children: ReactNode;
};

/** 注入目前作用中隊伍的運動模組（註解：coach／player layout 包一層）。 */
export function TeamSportProvider({ sport, children }: Props) {
  const mod = getSportModule(sport);
  return <TeamSportContext.Provider value={mod}>{children}</TeamSportContext.Provider>;
}

/** 讀取目前隊伍運動外掛；須在 TeamSportProvider 內使用 */
export function useTeamSport(): SportModule {
  const ctx = useContext(TeamSportContext);
  if (!ctx) {
    throw new Error("useTeamSport 須在 TeamSportProvider 內使用");
  }
  return ctx;
}

/** 讀取目前隊伍運動；Provider 外回傳 null（註解：AppLogo 等可選用）。 */
export function useOptionalTeamSportId(): SportId | null {
  const ctx = useContext(TeamSportContext);
  return ctx?.id ?? null;
}

/** 讀取目前運動的比賽統計外掛；須在 TeamSportProvider 內且 matchStats 已啟用 */
export function useMatchModule(): SportMatchClientModule {
  const sport = useTeamSport();
  if (!sport.match) {
    throw new Error(`${sport.labels.name} 尚未啟用比賽統計模組`);
  }
  return sport.match;
}
