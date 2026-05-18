import { getDisplayTimeZone } from "@/lib/display-timezone";

const tz = () => getDisplayTimeZone();

/** 日期＋時間（註解：固定隊伍顯示時區，避免伺服端 UTC 誤顯）。 */
export function formatDateTimeZh(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString("zh-TW", { timeZone: tz(), ...options });
}

/** 僅日期 */
export function formatDateZh(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleDateString("zh-TW", { timeZone: tz(), ...options });
}

/** 僅時間 */
export function formatTimeZh(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleTimeString("zh-TW", { timeZone: tz(), ...options });
}
