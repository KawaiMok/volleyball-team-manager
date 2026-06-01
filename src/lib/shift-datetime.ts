/** 將日期時間平移 N 天（註解：保留時分，用於複製每週固定訓練）。 */
export function shiftDateByDays(d: Date, days: number): Date {
  const out = new Date(d.getTime());
  out.setDate(out.getDate() + days);
  return out;
}

/** 可選日期平移；`null` 維持 `null`（註解：undefined 表示欄位未提供）。 */
export function shiftOptionalDate(
  d: Date | null | undefined,
  days: number,
): Date | null | undefined {
  if (d === undefined) return undefined;
  if (d === null) return null;
  return shiftDateByDays(d, days);
}
