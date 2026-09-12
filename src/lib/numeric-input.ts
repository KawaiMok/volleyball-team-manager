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

/** 小數輸入清理（註解：保留數字與至多一個小數點）。 */
export function sanitizeDecimalInput(raw: string, maxDecimalPlaces: number): string {
  if (raw === "") return "";
  let cleaned = raw.replace(/[^\d.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join("")}`;
  }
  if (maxDecimalPlaces <= 0) {
    return cleaned.replace(/\./g, "");
  }
  const dot = cleaned.indexOf(".");
  if (dot >= 0) {
    const intPart = cleaned.slice(0, dot);
    const decPart = cleaned.slice(dot + 1, dot + 1 + maxDecimalPlaces);
    return decPart.length > 0 ? `${intPart}.${decPart}` : `${intPart}.`;
  }
  return cleaned;
}

/** 解析可空小數；空白回傳 null（註解：體能測試 attempts）。 */
export function parseDecimalOrNull(raw: string, maxDecimalPlaces: number): number | null {
  const t = raw.trim();
  if (!t || t === ".") return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  if (n < 0) return null;
  return Number(n.toFixed(maxDecimalPlaces));
}

/** 顯示小數欄位（註解：0 與 null 皆顯示空白）。 */
export function formatDecimalFieldValue(n: number | null | undefined, decimalPlaces: number): string {
  if (n == null || n === 0) return "";
  return n.toFixed(decimalPlaces);
}
