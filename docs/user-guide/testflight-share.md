# TestFlight — 分享 App 給朋友下載

> **適用**：排球隊管理 iOS App（Bundle ID：`com.volleyball.teammanager`）  
> **前提**：你已把 Build 上傳到 App Store Connect，且 TestFlight 可見該版本。

---

## 一、開發者：在 App Store Connect 設定

登入 [App Store Connect](https://appstoreconnect.apple.com/) → 選你的 App → **TestFlight**。

### 1. 確認 Build 狀態

| 狀態 | 意義 |
|------|------|
| Processing | Apple 還在處理，通常 10–30 分鐘 |
| Ready to Test | 可加入測試群組、邀請測試者 |
| Expired | Build 超過 90 天，需上傳新 Build |

上傳方式：Xcode **Product → Archive → Distribute App**，或使用 **Transporter**。

### 2. 選擇測試方式

#### 外部測試（推薦給朋友）

- 最多約 **10,000** 名測試者  
- 測試者**不必**加入你的 Apple Developer 團隊  
- **第一次**外部測試通常需通過 **Beta App Review**（數小時～約 2 天）

步驟：

1. TestFlight → **外部測試** → 建立群組（例如「朋友內測」）
2. 將 **Ready to Test** 的 Build 加入該群組
3. 填寫 **測試資訊**（What to Test、聯絡方式等）
4. 提交 Beta 審核（若系統要求）
5. 審核通過後，擇一邀請：
   - **Email 邀請**：輸入朋友的 Apple ID 信箱  
   - **公開連結（Public Link）**：開啟後複製連結，傳給朋友（最省事）

公開連結位置：**TestFlight → 外部測試 → 你的群組 → Enable Public Link**

#### 內部測試（僅限團隊成員）

- 最多 **100** 人  
- 對方須在 App Store Connect **Users and Access** 被加入團隊  
- 適合同事／核心測試，**不適合一般朋友**

---

## 二、你可以傳給朋友的訊息（範本）

### 使用公開連結

```text
iOS 內測「排球隊管理」安裝步驟：

1. 在 App Store 搜尋並安裝「TestFlight」（Apple 官方 App）
2. 用 iPhone 打開這個連結：[貼上你的 TestFlight 公開連結]
3. 在 TestFlight 裡點「接受」→「安裝」
4. 打開 App 後請用「Email + 密碼」登入（不要用 Google 登入）

需要網路才能使用。若有問題再跟我說。
```

### 使用 Email 邀請

朋友會在 **Apple ID 信箱**收到 TestFlight 邀請信 → 點 **View in TestFlight** → 安裝。

若沒收到，請查**垃圾郵件**，或改發公開連結。

---

## 三、朋友端：需要什麼

| 項目 | 說明 |
|------|------|
| 裝置 | iPhone 或 iPad（TestFlight **不支援 Android**） |
| TestFlight App | 從 App Store 免費安裝 |
| Apple ID | 一般 iCloud 帳號即可，**不必**付費開發者會員 |
| 網路 | 本 App 為 WebView 載入遠端網站，需能連線 |

---

## 四、使用本 App 的注意事項

1. **登入**：請用 **Email + 密碼**；App 內 **Google 登入**常因 WebView 限制失敗。  
2. **多隊伍**：若帳號屬於多支隊伍，頂欄點 **隊名 ▾** 可切換目前檢視的隊伍。  
3. **推播**（若已開啟）：TestFlight 使用 **Production APNs**；首次登入請允許通知權限。  
4. **更新**：有新 Build 時，TestFlight 會提示更新；舊 Build 過期後需開發者上傳新版本。

---

## 五、常見問題

| 狀況 | 處理 |
|------|------|
| Build 一直 Processing | 等待；或確認 Xcode / Transporter 上傳成功 |
| 無法加入外部測試者 | 等 Beta App Review 通過 |
| 朋友收不到邀請 | 查垃圾郵件；改用 **公開連結** |
| 連結／邀請失效 | Build 可能已過期（90 天），請開發者上傳新 Build |
| 安裝後一開就閃退 | 開發者檢查：Firebase／推播設定、遠端網址是否可連 |
| 登入後跳瀏覽器 | 請在 **App 畫面內**完成 Email 登入，與 Safari  cookie 分開 |

---

## 六、開發者檢查清單（分享前）

- [ ] Build 狀態為 **Ready to Test**
- [ ] 外部測試群組已加入該 Build
- [ ] Beta App Review 已通過（外部測試首次）
- [ ] 已開 **公開連結** 或已寄出邀請
- [ ] Vercel 正式站與 Clerk 登入正常
- [ ] （選用）推播：`APNS_*` 已設；TestFlight 勿用 `APNS_USE_SANDBOX=true`

---

## 相關技術文件

- [iOS 推播設定](../PUSH-SETUP-IOS.md)
- [Capacitor 行動殼](../../mobile/README.md)
- [Capacitor + 推播進度](../CAPACITOR-PUSH-PROGRESS.md)
