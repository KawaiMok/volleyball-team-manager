/**
 * 推播測試 API（POST /api/me/push-test）是否開放（註解：正式環境預設關閉，避免 FCM 濫發）。
 *
 * 規則：
 * - 設 `ALLOW_PUSH_TEST=1` 可於任何環境啟用
 * - 否則 Vercel Production 或 `APP_ENV=production` 一律關閉
 */
export function isPushTestAccessEnabled(): boolean {
  if (process.env.ALLOW_PUSH_TEST === "1") return true;
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.APP_ENV === "production") return false;
  return true;
}
