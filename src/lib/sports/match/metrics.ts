import type { PlayerStatsRecord, RatingDef, SportMatchClientModule } from "@/lib/sports/match/types";

/** 樣本收縮強度（註解：類似 pseudocount，樣本越少越靠近 prior）。 */
export const DEFAULT_SHRINK_STRENGTH = 5;
/** 低樣本警示門檻 */
export const DEFAULT_MIN_SAMPLE = 3;

/** 格式化百分比 */
export function formatPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

/** 格式化 rating */
export function formatRating(value: number | null, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(digits);
}

/** 圖表數值顯示（註解：百分比欄位顯示為 %，其餘保留小數）。 */
export function formatMetricChartValue(value: number, asPercent = false): string {
  if (!Number.isFinite(value)) return "—";
  if (asPercent) return `${(value * 100).toFixed(1)}%`;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

/** 將 rating 正規化到 0–1 */
export function normalizeRating(value: number | null, min: number, max: number): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (max <= min) return null;
  return clamp01((value - min) / (max - min));
}

/** rating 區間中點，作為樣本不足時的收縮目標 */
export function ratingPrior(normMin: number, normMax: number): number {
  return (normMin + normMax) / 2;
}

/** 向 prior 收縮，降低小樣本極端值 */
export function shrinkRating(
  raw: number | null,
  sampleSize: number,
  prior: number,
  strength = DEFAULT_SHRINK_STRENGTH,
): number | null {
  if (raw == null || !Number.isFinite(raw)) return null;
  if (sampleSize <= 0) return null;
  if (strength <= 0) return raw;
  return (raw * sampleSize + prior * strength) / (sampleSize + strength);
}

export type AdjustedRatingResult = {
  raw: number | null;
  adjusted: number | null;
  sampleSize: number;
  lowSample: boolean;
};

/** 計算單一 rating 的原始值與收縮後值 */
export function computeAdjustedRating(def: RatingDef, stats: PlayerStatsRecord): AdjustedRatingResult {
  const raw = def.compute(stats);
  const sampleSize = def.sampleSize?.(stats) ?? 0;
  const prior = ratingPrior(def.normMin, def.normMax);
  const minSample = def.minSampleSize ?? DEFAULT_MIN_SAMPLE;
  const adjusted = shrinkRating(
    raw,
    sampleSize,
    prior,
    def.shrinkStrength ?? DEFAULT_SHRINK_STRENGTH,
  );
  return {
    raw,
    adjusted,
    sampleSize,
    lowSample: sampleSize > 0 && sampleSize < minSample,
  };
}

/** 總指標：使用收縮後 rating 正規化平均 */
export function computeAdjustedOverallIndicator(
  match: SportMatchClientModule,
  stats: PlayerStatsRecord,
): number | null {
  const parts = match.ratings
    .map((def) => {
      const { adjusted } = computeAdjustedRating(def, stats);
      return adjusted != null ? normalizeRating(adjusted, def.normMin, def.normMax) : null;
    })
    .filter((x): x is number => x != null);
  if (parts.length === 0) return null;
  return Math.round((parts.reduce((s, x) => s + x, 0) / parts.length) * 1000) / 10;
}

/** rating 圖表比例尺：以 0 為下界、normMax 為上界（註解：避免 -1~1 全區間壓縮 0.2 vs 0.5 的視覺差異）。 */
export function ratingChartBounds(def: Pick<RatingDef, "normMax">): { min: number; max: number } {
  return { min: 0, max: def.normMax };
}

/** rating 橫條寬度百分比 */
export function ratingChartBarWidth(
  value: number | null,
  def: Pick<RatingDef, "normMax">,
): string {
  if (value == null || !Number.isFinite(value)) return "0%";
  const { min, max } = ratingChartBounds(def);
  if (max <= min) return "0%";
  const x = (value - min) / (max - min);
  return `${Math.round(clamp01(x) * 100)}%`;
}

/** 合併多場個人 stats（累加計數） */
export function mergePlayerStats(
  categories: readonly string[],
  categoryFields: Record<string, { key: string }[]>,
  a: Record<string, Record<string, number> | undefined>,
  b: Record<string, Record<string, number> | undefined>,
): Record<string, Record<string, number> | undefined> {
  const out: Record<string, Record<string, number>> = {};
  for (const cat of categories) {
    const fields = categoryFields[cat] ?? [];
    const merged: Record<string, number> = {};
    let has = false;
    for (const f of fields) {
      if (f.key.startsWith("_")) continue;
      const sum = (a[cat]?.[f.key] ?? 0) + (b[cat]?.[f.key] ?? 0);
      if (sum > 0) {
        merged[f.key] = sum;
        has = true;
      }
    }
    if (has) out[cat] = merged;
  }
  return out;
}
