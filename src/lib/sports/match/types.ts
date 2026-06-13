import type { z } from "zod";

/** 分段比分（DB 欄位名仍為 `sets`） */
export type PeriodScore = { our: number; opponent: number };

/** 個人 stats JSON：分類 → 欄位計數 */
export type PlayerStatsRecord = Record<string, Record<string, number> | undefined>;

export type StatFieldDef = {
  key: string;
  label: string;
  /** 衍生欄位鍵，由模組 `derivedStatValue` 解讀 */
  derived?: string;
};

export type RatingDef = {
  key: string;
  label: string;
  compute: (stats: PlayerStatsRecord) => number | null;
  /** 正規化至 0–1 供總指標使用 */
  normMin: number;
  normMax: number;
  /** 樣本數（註解：觸球／嘗試次數，用於收縮極端 rating） */
  sampleSize?: (stats: PlayerStatsRecord) => number;
  /** 收縮強度（預設 5） */
  shrinkStrength?: number;
  /** 低於此樣本數顯示警示（預設 3） */
  minSampleSize?: number;
};

/** 表現突出榜單定義（註解：數值愈高愈好）。 */
export type StandoutLeaderDef = {
  key: string;
  title: string;
  subtitle?: string;
  compute: (stats: PlayerStatsRecord, matchCount: number) => number | null;
  formatValue: (value: number) => string;
};

/** 比分區段設定 */
export type MatchScoreConfig = {
  kind: "sets" | "halves" | "quarters";
  /** 固定段數（足球 2、籃球 4）；排球為 undefined 表示可增減 */
  fixedPeriodCount?: number;
  minPeriods: number;
  maxPeriods: number;
  canAddPeriod: boolean;
  /** periodWins＝局數／節數勝負；totalPoints＝加總得分 */
  summaryMode: "periodWins" | "totalPoints";
  periodLabel: (index: number) => string;
  periodsSectionTitle: string;
};

/** 比賽結果檢視／表單用 */
export type MatchResultViewData = {
  opponentName: string | null;
  periods: PeriodScore[];
  teamStats: Record<string, number | undefined> | null;
  notes: string | null;
  playerStats: Array<{
    memberId: string;
    displayName: string;
    stats: PlayerStatsRecord;
  }>;
};

export type MatchResultPlayerRow = {
  memberId: string;
  displayName: string;
  stats: PlayerStatsRecord;
};

/** API PUT body（各運動 Zod 結構相同，欄位語意依運動而異） */
export type MatchResultBody = {
  opponentName?: string | null;
  sets: PeriodScore[];
  teamStats?: Record<string, number | undefined> | null;
  notes?: string | null;
  playerStats: Array<{ memberId: string; stats: PlayerStatsRecord }>;
};

/** 運動比賽統計外掛（client 安全；含 Zod 供 API 驗證） */
export type SportMatchClientModule = {
  score: MatchScoreConfig;
  categories: readonly string[];
  categoryLabels: Record<string, string>;
  categoryFields: Record<string, StatFieldDef[]>;
  teamStatKeys: readonly string[];
  teamStatLabels: Record<string, string>;
  ratings: RatingDef[];
  /** 隊伍統計「表現突出者」榜單 */
  standoutLeaders: readonly StandoutLeaderDef[];
  matchResultBodySchema: z.ZodType;

  emptyPlayerStats: () => PlayerStatsRecord;
  normalizePlayerStats: (raw: unknown) => PlayerStatsRecord;
  compactPlayerStats: (stats: PlayerStatsRecord) => PlayerStatsRecord;
  hasCategoryData: (stats: PlayerStatsRecord, category: string) => boolean;
  hasAnyPlayerStats: (stats: PlayerStatsRecord) => boolean;
  derivedStatValue: (stats: PlayerStatsRecord, derived: string) => string;
  /** 欄位數值（註解：含衍生指標，供圖表比較） */
  getFieldNumericValue: (stats: PlayerStatsRecord, category: string, fieldKey: string) => number | null;
  /** 欄位樣本數（註解：觸球／嘗試次數） */
  getFieldSampleSize: (stats: PlayerStatsRecord, category: string, fieldKey: string) => number;
  playerOverallSummary: (stats: PlayerStatsRecord) => string;
  computeOverallIndicator: (stats: PlayerStatsRecord) => number | null;
  addPlayerStats: (a: PlayerStatsRecord, b: PlayerStatsRecord) => PlayerStatsRecord;
  /** 大比分區顯示用 */
  computeScoreSummary: (
    periods: PeriodScore[],
    teamName: string,
    opponentName: string,
  ) => {
    ourValue: number;
    opponentValue: number;
    won: boolean | null;
    headline: string;
    subline?: string;
  };
  sumPeriodScores: (periods: PeriodScore[]) => PeriodScore;
};
