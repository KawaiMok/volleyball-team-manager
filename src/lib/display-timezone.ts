/** 畫面顯示用 IANA 時區（註解：Vercel 伺服端預設 UTC，須明確指定；可設 `NEXT_PUBLIC_DISPLAY_TIMEZONE`）。 */
export function getDisplayTimeZone(): string {
  const fromEnv = process.env.NEXT_PUBLIC_DISPLAY_TIMEZONE?.trim();
  return fromEnv || "Asia/Taipei";
}
