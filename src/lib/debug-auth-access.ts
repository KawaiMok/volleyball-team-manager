/**
 * Debug 身分繞過（x-debug-* header／cookie）是否啟用（註解：正式環境強制關閉）。
 *
 * 規則：
 * - 須 `ALLOW_DEBUG_AUTH=true`
 * - **Vercel Production**（`VERCEL_ENV=production`）一律關閉
 * - 非 Vercel 之正式機請設 **`APP_ENV=production`** 關閉
 */
export function isDebugAuthEnabled(): boolean {
  if (process.env.ALLOW_DEBUG_AUTH !== "true") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.APP_ENV === "production") return false;
  return true;
}
