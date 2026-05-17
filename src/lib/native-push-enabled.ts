/**
 * 是否啟用 App 內推播註冊（註解：須已設定 Firebase `google-services.json` 後才設為 true，否則 Android 可能原生閃退）。
 */
export function isNativePushBridgeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_NATIVE_PUSH === "true";
}
