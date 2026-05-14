/**
 * Bootstrap（/api/bootstrap、claim、onboarding 按鈕）是否啟用（註解：正式環境強制關閉）。
 *
 * 規則：
 * - 須 `ALLOW_BOOTSTRAP=1`
 * - **Vercel Production**（`VERCEL_ENV=production`）一律關閉，避免誤設變數外洩示範資料 API
 * - 非 Vercel 之正式機請設 **`APP_ENV=production`** 關閉（與 `NODE_ENV` 無綁，以免 `next start` 本機無法測 bootstrap）
 */
export function isBootstrapAccessEnabled(): boolean {
  if (process.env.ALLOW_BOOTSTRAP !== "1") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  if (process.env.APP_ENV === "production") return false;
  return true;
}
