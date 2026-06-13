import type { SportCourtModule } from "@/lib/sports/court/types";
import type { SportMatchClientModule } from "@/lib/sports/match/types";
import type { SportId } from "@/lib/sports/sport-id";

/** 運動模組：戰術板／比賽統計等能力開關（註解：Phase 0 僅排球全開）。 */
export type SportCapabilities = {
  /** 內建 SVG 場上企位／即時戰術版 */
  courtSketch: boolean;
  liveTactical: boolean;
  /** 比賽結果與個人／球隊統計 */
  matchStats: boolean;
};

/** 運動專用 UI 文案 */
export type SportLabels = {
  /** 繁中運動名稱 */
  name: string;
  /** 隊員「位置」欄位 placeholder */
  positionPlaceholder: string;
};

/** 比賽結果 API 用 Zod（註解：向後相容別名）。 */
export type SportMatchModule = Pick<SportMatchClientModule, "matchResultBodySchema">;

/** 單一運動外掛模組（註解：client／server 共用）。 */
export type SportModule = {
  id: SportId;
  labels: SportLabels;
  capabilities: SportCapabilities;
  /** 內建戰術板設定；capabilities.courtSketch 為 false 時為 null */
  court: SportCourtModule | null;
  /** 比賽統計外掛；capabilities.matchStats 為 false 時為 null */
  match: SportMatchClientModule | null;
};
