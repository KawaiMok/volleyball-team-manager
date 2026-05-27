/** 數字輸入欄共用工具（註解：避免 controlled number input 無法輸入）。 */

/** 顯示用：0 顯示空白，方便重新輸入。 */
export function formatNumericFieldValue(n: number): string {
  return n === 0 ? "" : String(n);
}

/** 表單字串欄：空字串維持空白，其餘只保留數字。 */
export function sanitizeNonNegativeIntInput(raw: string): string {
  if (raw === "") return "";
  return raw.replace(/[^\d]/g, "");
}

/** 解析非負整數；空白回傳 undefined。 */
export function parseNonNegativeInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
}

/** 解析非負整數；空白視為 0（註解：個人數據欄位預設 0）。 */
export function parseNonNegativeIntOrZero(raw: string): number {
  return parseNonNegativeInt(raw) ?? 0;
}
