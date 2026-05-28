import type { PlayerMatchStats } from "@/lib/match-result-schema";

/** 格式化百分比（註解：分母為 0 回傳 —）。 */
export function formatPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

/** 格式化 rating（註解：保留兩位小數）。 */
export function formatRating(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * 將 rating 正規化到 0–1（註解：供「總指標」合併使用；不同分類量尺不同）。
 * - 若超出區間則 clamp
 */
export function normalizeRating(value: number | null, min: number, max: number): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (max <= min) return null;
  return clamp01((value - min) / (max - min));
}

/** 攻擊：得分率%、失誤率%。 */
export function computeAttackRates(stats: PlayerMatchStats) {
  const a = stats.attack;
  if (!a || a.attempts <= 0) return { scoreRate: null, errorRate: null };
  return {
    scoreRate: a.points / a.attempts,
    errorRate: a.errors / a.attempts,
  };
}

/**
 * 攻擊 rating（註解：用次數/得分/失誤計算）
 * 公式：\((得分 - 失誤) / 次數\)，區間約在 [-1, 1]（若 points/errors ≤ attempts）。
 */
export function computeAttackRating(stats: PlayerMatchStats): number | null {
  const a = stats.attack;
  if (!a || a.attempts <= 0) return null;
  return (a.points - a.errors) / a.attempts;
}

/** 攔網 rating = (得分×2 + 有效) / 次數。 */
export function computeBlockRating(stats: PlayerMatchStats): number | null {
  const b = stats.block;
  if (!b || b.attempts <= 0) return null;
  return (b.points * 2 + b.effective) / b.attempts;
}

/** 防守：有效防守% = 成功 / 次數。 */
export function computeDefenseRate(stats: PlayerMatchStats): number | null {
  const d = stats.defense;
  if (!d || d.attempts <= 0) return null;
  return d.success / d.attempts;
}

/**
 * 防守 rating（註解：用次數/成功/失誤計算）
 * 公式：\((成功 - 失誤) / 次數\)，區間約在 [-1, 1]。
 */
export function computeDefenseRating(stats: PlayerMatchStats): number | null {
  const d = stats.defense;
  if (!d || d.attempts <= 0) return null;
  return (d.success - d.errors) / d.attempts;
}

/** 一傳總數 = A + B + C + 被ACE。 */
export function computePassTotal(stats: PlayerMatchStats): number {
  const p = stats.pass;
  if (!p) return 0;
  return p.perfect + p.good + p.poor + p.aced;
}

/** 一傳 rating = (A×3 + B×2 + C×1 + 被ACE×(-1)) / 總數。 */
export function computePassRating(stats: PlayerMatchStats): number | null {
  const p = stats.pass;
  const total = computePassTotal(stats);
  if (!p || total <= 0) return null;
  const score = p.perfect * 3 + p.good * 2 + p.poor * 1 + p.aced * -1;
  return score / total;
}

/** 發球總數 = A + B + C + 失誤 + ACE。 */
export function computeServeTotal(stats: PlayerMatchStats): number {
  const s = stats.serve;
  if (!s) return 0;
  return s.strong + s.normal + s.weak + s.errors + s.aces;
}

/** 發球 rating = (ACE×4 + A×3 + B×2 + C×1 + 失誤×(-1)) / 總數。 */
export function computeServeRating(stats: PlayerMatchStats): number | null {
  const s = stats.serve;
  const total = computeServeTotal(stats);
  if (!s || total <= 0) return null;
  const score = s.aces * 4 + s.strong * 3 + s.normal * 2 + s.weak * 1 + s.errors * -1;
  return score / total;
}

/**
 * 總指標（註解：整合各範疇 rating）
 * - 將各分類 rating 正規化到 0–1
 * - 取「可用」分類的平均
 * - 轉成 0–100（越高越好）
 */
export function computeOverallIndicator(stats: PlayerMatchStats): number | null {
  const parts: Array<number | null> = [
    normalizeRating(computeAttackRating(stats), -1, 1),
    normalizeRating(computeDefenseRating(stats), -1, 1),
    normalizeRating(computeBlockRating(stats), 0, 3),
    normalizeRating(computePassRating(stats), -1, 3),
    normalizeRating(computeServeRating(stats), -1, 4),
  ];
  const usable = parts.filter((x): x is number => x != null);
  if (usable.length === 0) return null;
  const avg = usable.reduce((s, x) => s + x, 0) / usable.length;
  return Math.round(avg * 1000) / 10;
}
