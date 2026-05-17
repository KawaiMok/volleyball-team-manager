# 行動殼（Capacitor）

Web UI 仍由 Next.js 部署網址提供；此目錄為 **薄殼**，以 WebView 載入遠端站點並掛上原生推播外掛。

## 設定載入網址

建立或編輯環境變數（建置／sync 前）：

```bash
# 正式環境示例（請換成你的網域）
export CAPACITOR_SERVER_URL="https://your-domain.com"
```

未設定時，`capacitor.config.ts` 內預設為占位 `https://YOUR_PRODUCTION_DOMAIN`，**請勿**在未改動下上架。

本機除錯可指向開發主機（需允許 cleartext 或 HTTPS）：

- Android 模擬器存主機：`http://10.0.2.2:3000`
- 實機：同一區網電腦 IP，例如 `http://192.168.1.10:3000`

## 常用指令

於 `volleyball-team-manager/mobile/`：

```bash
npm install
npx cap sync
npm run open:android   # Android Studio
npm run open:ios       # Xcode
```

## Android 推播（FCM）

1. 在 [Firebase Console](https://console.firebase.google.com) 建立專案並加入 **Android App**，`applicationId` 須與 `capacitor.config.ts` 的 `appId`（`com.volleyball.teammanager`）一致，或你改成與 Firebase 相同。
2. 下載 `google-services.json`，放到 `android/app/`（Capacitor／Firebase 標準位置）。
3. 依 [Firebase Android 設定](https://firebase.google.com/docs/android/setup) 確認 Gradle 已套用 Google 服務外掛（Capacitor 8 產生的專案可依官方文件補齊）。

## iOS 推播（APNs）

1. Apple Developer：為 App ID 開啟 **Push Notifications**。
2. 建立 APNs **金鑰（.p8）**，供**後端**發送使用（勿提交到 git）。
3. Xcode 開啟 `ios/App/App.xcworkspace`（或 `.xcodeproj`），Target → **Signing & Capabilities** 加入 **Push Notifications**。

## 與 Next 站台的銜接

已在 Web 專案加入 `CapacitorPushBridge`：使用者於 App 內登入後會向 `POST /api/me/push-token` 回報 token。後端發送邏輯見 `src/lib/push/send.ts`（目前為 stub，需接上 FCM／APNs）。

## 三星／Android：一開 App 就跳系統瀏覽器

**常見原因**

1. **Clerk 登入網域未允許在 WebView 內導覽** → Capacitor 改開 Chrome／三星瀏覽器。已在 `capacitor.config.ts` 的 `server.allowNavigation` 加入 Clerk／Google OAuth 網域；改完請執行 `npx cap sync` 再從 Android Studio **Run** 重裝。
2. **瀏覽器已登入 ≠ App 已登入**：App 內 WebView 的 Cookie **與** 三星瀏覽器／Chrome **分開**。在瀏覽器登入過，打開 App 仍可能再導向登入；請在 **App 畫面內** 用 Email／密碼登入一次。
3. **桌面圖示其實是「加入主畫面」捷徑**：長按圖示 → 應用程式資訊，套件名須為 `com.volleyball.teammanager`。若是捷徑，刪除後只保留 Android Studio 安裝的 APK。

**三星設定（可選）**

設定 → 應用程式 → **排球隊管理** → 設為預設 → **支援的連結** → 選「在此應用程式中開啟」（勿選「一律在瀏覽器中開啟」）。

## 登入後閃退、一開 App 就閃退

**常見原因**：已登入時會跑推播註冊，但 Android 尚未設定 Firebase（沒有 `android/app/google-services.json`），原生層在 `PushNotifications.register()` 崩潰。

**處理**：

1. 確認 Vercel **未**設 `NEXT_PUBLIC_ENABLE_NATIVE_PUSH=true`（程式預設關閉推播橋接）。重新 deploy 後再開 App。
2. 若仍閃退：Android Studio → **Logcat**（見下節）搜尋 `FATAL` 或 `volleyball`。
3. 完成 FCM 設定後，再在 Vercel 設 `NEXT_PUBLIC_ENABLE_NATIVE_PUSH=true`。

### 在 Android Studio 看 Log（Logcat）

1. 手機 USB 連線，開啟 **USB 偵錯**。
2. Android Studio 開啟 `mobile/android`，底部點 **Logcat**。
3. 裝置選你的三星手機；篩選：
   - **package:mine**（只顯示本 App），或
   - 搜尋：`com.volleyball.teammanager`、`FATAL EXCEPTION`、`AndroidRuntime`。
4. 清空 log（垃圾桶圖示）→ 在手機**再開一次 App** → 看閃退當下紅色錯誤堆疊。

終端機也可：`adb logcat | grep -iE "volleyball|FATAL|capacitor"`（需已安裝 platform-tools）。

## `403: disallowed_useragent`（Google 登入）

Google **禁止**在 App 內嵌 WebView 做 OAuth，會出現此錯誤。Web 專案已在 App 內**隱藏** Google 等第三方按鈕，請改用 **Email + 密碼**。部署新版網站到 Vercel 後，在 App 內重新整理登入頁即可（殼載入遠端網址，無需重裝 APK，除非只改原生設定）。
