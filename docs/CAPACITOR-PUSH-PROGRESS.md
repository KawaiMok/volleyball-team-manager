# Capacitor + 推播 — 實作進度

> 對應計畫：本機 Cursor 計畫檔 `web_轉手機_app_路徑_bc9e1d30.plan.md`（若曾匯出副本，亦可放在 repo `docs/` 內）。

**最後更新**：依 repo 實作狀態手動勾選；部署資料庫後請執行 `npm run db:deploy` 套用 migration `20260516200000_add_push_device`。

---

## 程式與結構（本 repo 已完成／已建立）

| 項目 | 狀態 | 說明 |
|------|------|------|
| Prisma `PushDevice` + `PushPlatform` | [x] | [`prisma/schema.prisma`](../prisma/schema.prisma)、migration `20260516200000_add_push_device` |
| `POST` / `DELETE` `/api/me/push-token` | [x] | [`src/app/api/me/push-token/route.ts`](../src/app/api/me/push-token/route.ts)；以 `getOrSyncPrismaUserFromClerk` 驗證（無須已有隊籍） |
| 推播發送 stub | [x] | [`src/lib/push/send.ts`](../src/lib/push/send.ts)（預留 FCM／APNs） |
| Web 橋接（Capacitor 內註冊推播並上傳 token） | [x] | [`src/components/capacitor-push-bridge.tsx`](../src/components/capacitor-push-bridge.tsx)，已掛於 [`src/app/layout.tsx`](../src/app/layout.tsx) |
| 依賴 | [x] | 主專案 `package.json`：`@capacitor/core`、`@capacitor/push-notifications` |
| `mobile/` Capacitor 專案 | [x] | [`mobile/`](../mobile/)、已 `cap add android` / `ios`、`@capacitor/push-notifications` |
| `mobile/capacitor.config.ts` | [x] | `server.url` 由 `CAPACITOR_SERVER_URL` 覆寫（預設占位 `https://YOUR_PRODUCTION_DOMAIN`） |

---

## 階段 A：殼與 Clerk（手動／實機）

| # | 步驟 | 狀態 |
|---|------|------|
| 1 | 建立 Capacitor 專案結構 | [x]（`mobile/`） |
| 2 | `server.url` = production HTTPS | [ ] | 建置前設 `CAPACITOR_SERVER_URL` 或改 `capacitor.config.ts` |
| 3 | Android / iOS 平台 | [x] | 已產生 `mobile/android`、`mobile/ios` |
| 4 | 實機安裝、WebView 載入網站 | [ ] | |
| 5 | 實機 Clerk 登入／登出 | [ ] | |
| 6 | `/coach`、`/player` 與保護路由一致 | [ ] | |
| 7 | Clerk Dashboard 網域與 redirect | [ ] | |
| 8 | 必要時 Universal Links／App Links／URL scheme | [ ] | |

---

## 階段 B：推播（FCM + APNs + 後端發送）

| # | 步驟 | 狀態 |
|---|------|------|
| 9 | Firebase 專案、`google-services.json` 放入 Android 專案 | [ ] | 見 [`mobile/README.md`](../mobile/README.md) |
| 10 | Apple Push、APNs 金鑰、Xcode capability | [ ] | |
| 11 | 裝置取得推播 token（外掛已整合） | [ ] | 須完成 9、10 與實機權限 |
| 12 | Token 寫入後端 | [x] | API 已就緒；依賴使用者已登入 |
| 13 | DB migration 上線 | [ ] | 正式環境執行 `db:deploy` |
| 14 | API 驗證行為 | [ ] | 可自行用已登入 session `POST` 測試 |
| 15 | 實作 `send.ts`（FCM HTTP v1 + APNs） | [ ] | 目前為 stub |
| 16 | 業務事件觸發推播 | [ ] | 例：賽事發布、留言 |

---

## 階段 C：上架與合規

| # | 步驟 | 狀態 |
|---|------|------|
| 17 | 開發者帳號、Bundle ID 與 Firebase／APNs 一致 | [ ] | |
| 18 | 隱私政策（推播／第三方） | [ ] | |
| 19 | TestFlight／內測 → 送審 | [ ] | |

---

## 快速指令

```bash
# 資料庫（本機／CI）
cd volleyball-team-manager && npm run db:migrate   # 開發
npm run db:deploy                                     # 正式

# 原生殼（於 mobile/）
cd mobile && npm install && npx cap sync
npm run open:android   # 或 open:ios
```

---

## API 摘要（測試用）

- `POST /api/me/push-token`，JSON：`{ "token": "<裝置 token>", "platform": "ios" | "android" }`（需 Clerk 登入 cookie）。
- `DELETE /api/me/push-token`，可選 body：`{ "token": "<僅刪單一裝置>" }`；若無 body 刪除該使用者全部裝置記錄。
