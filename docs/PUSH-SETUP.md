# Android 推播設定（FCM）

依序完成下列步驟。iOS（APNs）尚未實作，目前僅 **Android** 可收推播。

---

## 一、Firebase 主控台

1. 開啟 [Firebase Console](https://console.firebase.google.com/) → **新增專案**（或選既有專案）。
2. **新增應用程式** → 選 **Android**。
3. **Android 套件名稱** 須與 Capacitor 一致：`com.volleyball.teammanager`  
   （見 [`mobile/capacitor.config.ts`](../mobile/capacitor.config.ts) 的 `appId`）。
4. 下載 **`google-services.json`**。
5. 放到：

   ```text
   volleyball-team-manager/mobile/android/app/google-services.json
   ```

6. Firebase → **專案設定** → **服務帳戶** → **產生新的私密金鑰**（JSON）。  
   **勿提交到 Git**；內容用於伺服端發送（下一步）。

---

## 二、本機 Android 重裝

```bash
cd volleyball-team-manager/mobile
npx cap sync android
```

Android Studio → 選實機 → **Run（▶）** 重裝 App（有 `google-services.json` 後才安全開推播）。

---

## 三、Vercel 環境變數（伺服端發送）

在 Vercel → Project → **Settings → Environment Variables** 新增（Production）：

**方式 A（建議）：三欄位**

| 變數 | 說明 |
|------|------|
| `FIREBASE_PROJECT_ID` | 服務帳戶 JSON 的 `project_id` |
| `FIREBASE_CLIENT_EMAIL` | `client_email` |
| `FIREBASE_PRIVATE_KEY` | `private_key`（整段含 `-----BEGIN...`，換行可寫成 `\n`） |

**方式 B：整段 JSON**

| 變數 | 說明 |
|------|------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | 服務帳戶 JSON **整份** 壓成一行 |

Deploy 後，伺服端才能呼叫 FCM 發推。

---

## 四、啟用 App 內推播註冊

FCM 與 APK 都就緒後，在 Vercel 新增：

```text
NEXT_PUBLIC_ENABLE_NATIVE_PUSH=true
```

再 **Redeploy** 網站（App 載入遠端網址，不必為此單獨改 APK，但 **必須** 已用含 `google-services.json` 的 APK）。

使用者登入後，App 會請求通知權限並將 token 送到 `POST /api/me/push-token`。

---

## 五、驗收

1. 手機 App 登入（Email／密碼），允許通知權限。
2. 瀏覽器登入同一帳號（或 Postman 帶 Clerk cookie），對已部署站發送：

   ```http
   POST /api/me/push-test
   ```

   應在數秒內收到「測試推播」。

3. 教練端 **發布活動** 後，隊伍成員若已註冊 token，應收到「新活動通知」。

---

## 疑難排解

| 狀況 | 處理 |
|------|------|
| 登入後閃退 | 確認已有 `google-services.json` 且已重裝 APK；或暫時勿設 `NEXT_PUBLIC_ENABLE_NATIVE_PUSH=true` |
| `503` push-test | Vercel 未設 `FIREBASE_*` |
| `no_devices` | App 未成功註冊 token；檢查權限與 `ENABLE_NATIVE_PUSH` |
| 收不到推播 | Logcat 搜尋 `FCM`；確認 token 在 DB `PushDevice` 表 |

詳見 [`mobile/README.md`](../mobile/README.md)、進度 [`CAPACITOR-PUSH-PROGRESS.md`](./CAPACITOR-PUSH-PROGRESS.md)。
