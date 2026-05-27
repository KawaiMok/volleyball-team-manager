# RN 化 UI 進度追蹤

> 對照計畫：`.cursor/plans/rn_化視覺與動效_e34239e8.plan.md`  
> 品牌來源：`public/logo/327313560_3317975455133941_4020657334421874313_n.jpg`（慈青體育會 / AAAISM）

**最後更新**：2026-05-21

---

## 圖例

- `[x]` 已完成
- `[ ]` 未開始
- `[~]` 進行中

---

## 第一階段：品牌與 Design Token

| 狀態 | 項目 |
|------|------|
| [x] | `public/logo/badge.svg` — 簡化團徽（藍圈 + 圖騰 + 排球線） |
| [x] | `public/logo/mascot.svg` — 擬人排球吉祥物 |
| [x] | `src/components/brand/app-logo.tsx` — React 元件（badge / mascot） |
| [x] | `globals.css` — 藍白紅 brand token、Geist 字型、觸控 CSS |
| [x] | 落地頁 hero mascot + 卡片 badge |
| [x] | `layout.tsx` metadata icons / viewport-fit |
| [~] | Capacitor iOS / Android app icon（需手動由 badge.svg 匯出 512px PNG 後替換） |

---

## 第二階段：轉頁動畫

| 狀態 | 項目 |
|------|------|
| [x] | 安裝 `motion` 依賴 |
| [x] | `use-navigation-direction.ts` — forward / back 偵測 |
| [x] | `page-transition.tsx` — fade / slide stack |
| [x] | `coach/(main)/template.tsx`、`player/(main)/template.tsx` |
| [x] | `AppRouteLoading` mascot 彈跳動畫 |
| [x] | 原生模式輕量 loading overlay |
| [x] | `NavigationTransitionBar` 品牌色 |

---

## 第三階段：原生殼導覽與列表

| 狀態 | 項目 |
|------|------|
| [x] | 教練 / 球員 toolbar — Capacitor 精簡頂欄 + 返回鍵 |
| [x] | safe-area-inset-top |
| [x] | 修正 coach 雙重 bottom padding |
| [x] | `InsetGroupedList` 元件 |
| [x] | 球員行程列表 grouped 化 |
| [x] | 通知 inbox grouped 化 |
| [x] | 底 Tab 品牌色指示 + haptic |

---

## 第四階段：Capacitor 原生整合

| 狀態 | 項目 |
|------|------|
| [x] | `@capacitor/haptics`、`status-bar`、`app`、`splash-screen`（主 repo + mobile/package.json） |
| [x] | `CapacitorNativeBridge` — StatusBar / Android 返回 / 主題同步 |
| [x] | `lib/haptics.ts` — 供 Tab / toast 呼叫 |
| [x] | `capacitor.config.ts` splash 背景色 `#1e40af` |
| [x] | 執行 `cd mobile && npm install && npx cap sync`（2026-05-21 已完成） |

---

## 第五階段：Bottom Sheet

| 狀態 | 項目 |
|------|------|
| [x] | `bottom-sheet.tsx` 共用元件 |
| [x] | `team-roster-section.tsx` modal 遷移 |
| [x] | `feedback-summary-section.tsx` modal 遷移 |

---

## 驗收清單

- [x] 首頁 hero mascot、toolbar/favicon badge；深淺色正常；藍白紅配色
- [x] Tab fade；詳情 slide from right；返回 slide out（程式已接；Capacitor 實機待驗）
- [x] Capacitor：頂欄無漢堡、有返回；底 Tab + safe area（程式已接；實機待驗）
- [x] 球員行程 / 通知 grouped list
- [x] Android 返回鍵、haptic、StatusBar 隨主題（Bridge 已接；實機待驗）
- [x] 隊伍 roster + 回饋詳情改 bottom sheet（手機）

---

## 新增／修改的主要檔案

| 類型 | 路徑 |
|------|------|
| 品牌 | `public/logo/badge.svg`、`public/logo/mascot.svg`、`src/components/brand/app-logo.tsx` |
| 動效 | `src/components/ui/page-transition.tsx`、`src/app/coach/(main)/template.tsx`、`src/app/player/(main)/template.tsx` |
| 原生 | `src/components/capacitor-native-bridge.tsx`、`src/components/native-back-button.tsx`、`src/lib/haptics.ts` |
| UI | `src/components/ui/inset-grouped-list.tsx`、`src/components/ui/bottom-sheet.tsx` |
| 進度 | `docs/RN-UI-PROGRESS.md`（本檔） |

---

## 待辦（部署前）

1. **Vercel deploy** — Web UI 更新後 Capacitor 遠端殼自動生效。
2. **`mobile/` sync** — `cd mobile && npm install && npx cap sync`。
3. **App icon** — 將 `badge.svg` 匯出 512×512 PNG，替換 iOS `AppIcon` 與 Android adaptive icon。
4. **實機驗收** — 轉場、haptic、Android 返回、StatusBar 深色模式。

---

## 備註

- 原 JPG 保留供正式場合；日常 UI 以 SVG 為主。
- 教練端複雜表格頁（events / team）維持 Web 佈局，RN 化以列表型頁面為主。
- `npm run build` 已通過（2026-05-21）。
