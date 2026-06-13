# iOS 推播設定（APNs）

依序完成下列步驟。Android（FCM）見 [`PUSH-SETUP.md`](./PUSH-SETUP.md)。

**Bundle ID**（全專案須一致）：`com.volleyball.teammanager`

---

## 一、Apple Developer 主控台

### 1. 註冊 App ID

1. 登入 [Apple Developer](https://developer.apple.com/account/) → **Certificates, Identifiers & Profiles** → **Identifiers**。
2. 按 **+** → 選 **App IDs** → **App**。
3. **Description**：排球隊管理（或任意名稱）。
4. **Bundle ID**：選 **Explicit**，填 `com.volleyball.teammanager`。
5. **Capabilities** 勾選 **Push Notifications**（可一併勾 **Associated Domains**，日後 Universal Links 用）。
6. 儲存。

### 2. 建立 APNs 金鑰（.p8）

1. **Keys** → **+** → 名稱例如 `volleyball-push`。
2. 勾選 **Apple Push Notifications service (APNs)**。
3. 繼續 → **Register** → **Download** `.p8` 檔（**僅能下載一次**，請妥善保存）。
4. 記下 **Key ID**（10 字元）與 **Team ID**（Membership 頁面右上角）。

> **勿** 將 `.p8` 提交到 Git。

---

## 二、Xcode 簽署與能力

本 repo 已加入：

- `mobile/ios/App/App/App.entitlements`（Debug → sandbox）
- `mobile/ios/App/App/AppRelease.entitlements`（Release → production）
- `AppDelegate.swift` 的 APNs 註冊回呼
- `Info.plist` 的 `remote-notification` background mode

你仍需在 Xcode 完成 **Signing**：

```bash
cd volleyball-team-manager/mobile
npm install
npx cap sync ios
npm run open:ios
```

1. 選 Target **App** → **Signing & Capabilities**。
2. **Team**：選你的 Apple Developer 團隊。
3. 確認 **Bundle Identifier** = `com.volleyball.teammanager`。
4. 若 **Push Notifications** capability 未自動出現，按 **+ Capability** 加入（應與 entitlements 一致）。
5. 選你的 **iPhone 實機**（模擬器**無法**收 APNs）→ **Run（▶）** 安裝。

---

## 三、Vercel 環境變數（伺服端 APNs 發送）

在 Vercel → Project → **Settings → Environment Variables** 新增：

| 變數 | 說明 |
|------|------|
| `APNS_KEY_ID` | APNs 金鑰 Key ID（10 字元） |
| `APNS_TEAM_ID` | Apple Developer Team ID |
| `APNS_PRIVATE_KEY` | `.p8` 檔**完整內容**（含 `-----BEGIN PRIVATE KEY-----`；換行可寫成 `\n`） |
| `APNS_BUNDLE_ID` | 選填，預設 `com.volleyball.teammanager` |
| `APNS_USE_SANDBOX` | 選填；見下方說明 |

### `APNS_USE_SANDBOX` 何時設？

| 建置方式 | 裝置 token 環境 | 伺服端設定 |
|----------|-----------------|------------|
| Xcode **Debug** Run 到實機 | Sandbox | `APNS_USE_SANDBOX=true` |
| TestFlight / App Store / Release 建置 | Production | `APNS_USE_SANDBOX=false` 或不設（Production 預設） |

> TestFlight 使用 **production** APNs，不是 sandbox。

Deploy 後伺服端才能向 iOS 裝置發推。

---

## 四、啟用 App 內推播註冊

與 Android 相同，在 Vercel 設：

```text
NEXT_PUBLIC_ENABLE_NATIVE_PUSH=true
```

再 **Redeploy** 網站。App 載入遠端 URL，使用者登入後會請求通知權限並將 token 送到 `POST /api/me/push-token`（`platform: "ios"`）。

---

## 五、驗收

1. iPhone 實機安裝 App（Xcode Run 或 TestFlight）。
2. App 內登入，允許通知權限。
3. 對已部署站發送（需 Clerk 登入 cookie）：

   ```http
   POST /api/me/push-test
   ```

   應在數秒內收到「測試推播」。

4. 確認 DB `PushDevice` 表有 `platform = ios` 的 token 記錄。

---

## 疑難排解

| 狀況 | 處理 |
|------|------|
| `registrationError` / 無 token | 確認 App ID 已開 Push、Xcode Team 簽署正確、使用**實機**非模擬器 |
| `BadDeviceToken` | Sandbox / Production 環境不匹配：Debug 建置需 `APNS_USE_SANDBOX=true` |
| `InvalidProviderToken` | 檢查 `APNS_KEY_ID`、`APNS_TEAM_ID`、`.p8` 內容是否正確 |
| `TopicDisallowed` | `APNS_BUNDLE_ID` 須與 App 的 Bundle ID 一致 |
| 收不到但 token 已寫入 DB | 確認 Vercel 已 redeploy 且 APNs 環境變數在 Production |
| 點推播未導向頁面 | 確認 payload `data` 含 deep link 欄位（見 [`PUSH-NOTIFICATIONS.md`](./PUSH-NOTIFICATIONS.md)） |

---

## 下一步（上架）

- [ ] App Store Connect 建立 App 記錄（Bundle ID 同上）
- [ ] 隱私政策說明推播用途
- [ ] TestFlight 內測 → 送審

詳見 [`CAPACITOR-PUSH-PROGRESS.md`](./CAPACITOR-PUSH-PROGRESS.md)、[`mobile/README.md`](../mobile/README.md)。
