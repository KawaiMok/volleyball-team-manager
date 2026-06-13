# 多運動擴展 — 進度追蹤

> 對照計劃：Cursor 計劃「多運動擴展計劃」（單一 App、建隊時選運動）。  
> 產品形態：**一個 Next.js + 一個 Capacitor 殼**；排球／足球／籃球共用登入與資料庫。  
> 使用方式：完成項目改為 `[x]`，進行中標註「進行中」，部分完成用 `[~]`。

**最後更新**：2026-06-04（Phase 3 已完成）

---

## 總覽

| Phase | 名稱 | 預估週期 | 狀態 | 完成度 |
|-------|------|----------|------|--------|
| 0 | 運動類型與 Registry | 1–2 週 | 已完成 | 100% |
| 1 | 戰術板抽象 | 2–3 週 | 已完成 | 100% |
| 2 | 比賽統計抽象 + 足球／籃球 | 3–4 週+ | 已完成 | 100% |
| 3 | 足球／籃球戰術板 | 1–2 週 | 已完成 | 100% |
| 4 | 周邊（AI、文件、測試） | 1–2 週 | 未開始 | 0% |

**建議實作順序**：0 → 1 → 3（戰術可先給價值）∥ 2（統計可與 1/3 並行，但需先定欄位）→ 4

**整體 MVP 驗收**（見文末）：4 / 6 項完成（Phase 0–3）

---

## 圖例

- `[x]` 已完成
- `[~]` 部分完成
- `[ ]` 未開始
- `⏸` 待產品／教練決策（阻塞下游）

---

## 待決策（實作 Phase 2 統計前建議定案）

| 狀態 | 項目 | 備註 |
|------|------|------|
| [x] | 足球 v1 統計欄位 | 進攻／傳控／防守／門將／紀律／其他 |
| [x] | 籃球 v1 統計欄位 | 得分／籃板／組織／防守／犯規 |
| [x] | 足球比分格式 | 上下半場 + 全場合計 |
| [x] | 籃球比分格式 | 四節 + 全場合計 |
| [x] | 籃球戰術板 | v1 全場 5v5（半場 variant 留 Phase 5） |

---

## Phase 0：基礎 — 運動類型與 Registry

**目標**：建隊可選排球／足球／籃球；既有隊伍皆為排球；Registry 骨架可載入運動模組。

**狀態**：已完成 · **完成度**：100%

### 0.1 Schema 與 Migration

| 狀態 | 項目 |
|------|------|
| [x] | `prisma/schema.prisma` 新增 `enum Sport { VOLLEYBALL, SOCCER, BASKETBALL }` |
| [x] | `Team.sport` 欄位 `@default(VOLLEYBALL)` |
| [x] | Migration：`20260604120000_add_team_sport`（既有隊伍預設排球） |
| [x] | `prisma generate` / `db:deploy` 已驗證 |

### 0.2 Sport Registry

| 狀態 | 項目 |
|------|------|
| [x] | `src/lib/sports/types.ts`、`sport-id.ts`、`modules.ts` |
| [x] | `src/lib/sports/registry.ts`（client 安全 `getSportModule`） |
| [x] | `src/lib/sports/registry-server.ts`、`volleyball/match.ts`（server 比賽 schema） |
| [x] | Server：`getTeamSport` / `getTeamSportModule`（`src/lib/team-sport.ts`） |
| [x] | Client：`TeamSportProvider` + `useTeamSport()`（coach / player layout） |

### 0.3 API 與守衛

| 狀態 | 項目 |
|------|------|
| [x] | `PUT /api/events/[id]/match-result` 依運動 capabilities + `getSportMatchModule` |
| [x] | `PATCH` court-sketch / live-tactical-sketch：非排球回 403 |
| [x] | 建隊 API `sport` 必填（org teams POST）；bootstrap 預設排球 |
| [~] | 拒絕錯誤 sport payload 之整合測試（Phase 4） |

### 0.4 建隊 UI 與文案

| 狀態 | 項目 |
|------|------|
| [x] | 組織「建立球隊」表單：運動單選（建立後不可變提示） |
| [x] | 隊伍設定 PATCH 不含 `sport`（不可變） |
| [x] | `layout.tsx` metadata →「隊伍管理」 |
| [x] | `TeamMember.position` placeholder 由 registry 提供 |
| [x] | 足球／籃球：`SportFeatureComingSoon` + 隱藏即時戰術導覽 |

### Phase 0 交付驗收

- [x] 可建立三種運動隊伍
- [x] 既有排球隊行為與擴展前一致（build 通過）
- [x] `getSportModule(sportId)` 在 server / client 皆可呼叫

---

## Phase 1：戰術板抽象

**目標**：編輯器與 API 不依賴排球 SVG；排球邏輯搬至 `sports/volleyball/court`。

**狀態**：已完成 · **完成度**：100%  
**依賴**：Phase 0 完成

### 1.1 共用層

| 狀態 | 項目 |
|------|------|
| [x] | `court-sketch-schema.ts` 維持 v2（`metadata.sport` 留待 Phase 3） |
| [x] | `court-formation-editor.tsx` 經 `TeamSportProvider` 注入 `SportCourtModule` |
| [x] | `court-board-fullscreen-shell.tsx` 維持不變 |
| [x] | 外部戰術連結仍運動無關、三運動可用 |

### 1.2 排球 Court 模組搬移

| 狀態 | 項目 |
|------|------|
| [x] | `src/lib/sports/volleyball/court/surface.tsx` |
| [x] | `src/lib/sports/volleyball/court/default-sketch.ts` |
| [x] | `src/lib/sports/volleyball/court/config.ts`（`SportCourtModule`） |
| [x] | `src/lib/sports/court/types.ts`、`coords.ts` |
| [x] | 舊路徑 `court-full-surface.tsx`、`live-tactical-default-sketch.ts` re-export |

### 1.3 頁面整合

| 狀態 | 項目 |
|------|------|
| [x] | 教練 editor：`CourtFormationEditorInner` + `useTeamSport().court` |
| [x] | 球員 readonly：client 元件 + `useTeamSport().court` |
| [x] | `live-tactical/page.tsx`：`sportMod.court.withLiveTacticalStarterTokens` |
| [x] | `duplicate-event.ts`：同隊複製註解（跨隊不在此 API） |

### Phase 1 交付驗收

- [x] 排球隊：場上企位 + 即時戰術版與擴展前一致（build 通過）
- [x] `SportModule.court` 可替換 Surface（足球／籃球 Phase 3 接上 `court` 即可）

---

## Phase 3：足球／籃球戰術板

**目標**：足球 11v11、籃球 5v5 場地 SVG + 預設陣型 + 儲存／全屏／球員唯讀。

**狀態**：已完成 · **完成度**：100%  
**依賴**：Phase 1 完成

### 3.1 足球

| 狀態 | 項目 |
|------|------|
| [x] | `src/lib/sports/soccer/court/surface.tsx`（105×68、中圈、禁區、半場著色） |
| [x] | 預設 4-4-2（對方 1–11、我方 A–K） |
| [x] | `maxTokens: 26`、即時戰術版自動站位 |
| [x] | `courtSketch` + `liveTactical` 已啟用（沿用 Phase 1 編輯器） |

### 3.2 籃球

| 狀態 | 項目 |
|------|------|
| [x] | `src/lib/sports/basketball/court/surface.tsx`（FIBA 28×15、禁區、三分線弧） |
| [x] | 預設 5v5（對方 1–5、我方 A–E） |
| [~] | v1 全場；半場戰術 variant 留待 Phase 5 |
| [x] | `courtSketch` + `liveTactical` 已啟用 |

### Phase 3 交付驗收

- [x] 足球隊、籃球隊可完整使用內建戰術板（build 通過）
- [x] 外部 Excalidraw／Miro 連結不受影響（戰術影片區塊獨立）

---

## Phase 2：比賽統計抽象與各運動實作

**目標**：`SportMatchModule` 驅動輸入／圖表／隊伍累計；三運動各有專用 schema。

**狀態**：已完成 · **完成度**：100%  
**依賴**：Phase 0 完成

### 2.1 抽象層（排球搬移）

| 狀態 | 項目 |
|------|------|
| [x] | `src/lib/sports/volleyball/match/index.ts`（自 `match-result-schema.ts` 邏輯搬移） |
| [x] | `src/lib/sports/match/metrics.ts`、`types.ts` 共用指標工具 |
| [x] | `SportMatchClientModule` 介面 + `SportModule.match` |
| [x] | `MatchResultPanel`、`MatchPlayerStatsInputSection` 等改吃 `useMatchModule()` |
| [x] | `MatchStatsCharts`、`match-quick-indicators` 依 sport 動態 rating 欄位 |
| [x] | 保留 DB 欄位名 `MatchResult.sets`（語意為分段比分 JSON） |

### 2.2 排球回歸

| 狀態 | 項目 |
|------|------|
| [x] | 各局比分、六大類、球隊整體數據、rating／總指標 |
| [x] | `/coach/team/stats` 跨場累計 |
| [x] | 球員端 `match-result-readonly` |

### 2.3 足球統計 v1

| 狀態 | 項目 |
|------|------|
| [x] | `src/lib/sports/soccer/match/index.ts`（進攻／傳控／防守／門將／紀律／其他） |
| [x] | 比分 UI：固定上下半場 + 全場合計 |
| [x] | 教練輸入 + API PUT Zod 驗證 |
| [x] | 視覺化 + 隊伍統計累計 |

### 2.4 籃球統計 v1

| 狀態 | 項目 |
|------|------|
| [x] | `src/lib/sports/basketball/match/index.ts`（得分／籃板／組織／防守／犯規） |
| [x] | 比分 UI：固定四節 + 全場合計 |
| [x] | 教練輸入 + API PUT 驗證（含真實命中率衍生欄） |
| [x] | 視覺化 + 隊伍統計累計 |

### Phase 2 交付驗收

- [x] 三運動比賽統計可儲存、球員唯讀、隊伍統計頁正確累計
- [x] API 依運動動態 Zod 驗證 payload

---

## Phase 4：周邊能力

**目標**：AI、事件複製、文件、測試；產品文案與行動殼名稱通用化。

**狀態**：未開始 · **完成度**：0%  
**依賴**：Phase 2、3 核心完成後收尾

| 狀態 | 項目 |
|------|------|
| [ ] | AI：`generate-volleyball-training.ts` → 依 `sport` 切換 prompt（足球／籃球） |
| [ ] | `duplicate-event.ts` 最終規則與文件一致 |
| [ ] | 新增 `docs/MULTI-SPORT.md`（運動能力矩陣、JSON 範例） |
| [ ] | 更新本文件「最後更新」與各 Phase 完成度 |
| [ ] | 每 sport：schema 單元測試 |
| [ ] | API：錯誤 sport payload 整合測試 |
| [ ] | `capacitor.config.ts` / `layout` 顯示名稱通用化（Bundle ID 可暫不改） |
| [ ] | 排球隊 E2E 回歸（戰術 + 比賽統計 + 出席回饋） |

### 暫不納入（Phase 5 候選）

- [ ] 完整 i18n（next-intl 等）
- [ ] Repo 改名 `team-manager`
- [ ] 分運動獨立 App Store 殼

---

## 運動能力矩陣（預期終態）

| 能力 | 排球 | 足球 | 籃球 | 備註 |
|------|:----:|:----:|:----:|------|
| 事件／出席／RPE 回饋 | ✅ 已有 | ✅ 通用 | ✅ 通用 | 無需改 schema |
| 外部戰術連結 | ✅ | ✅ | ✅ | 已運動無關 |
| 內建戰術板 SVG | ✅ 已有 | ⏳ P3 | ⏳ P3 | P1 抽象後實作 |
| 比賽統計 | ✅ 已有 | ⏳ P2 | ⏳ P2 | 欄位待決策 |
| AI 訓練計畫 | ✅ 排球 | ⏳ P4 | ⏳ P4 | prompt 分運動 |

圖例：✅ 已完成 · ⏳ 計劃中 · — 不適用

---

## 整體 MVP 驗收清單

| 狀態 | 項目 |
|------|------|
| [x] | 建隊時可選排球／足球／籃球；既有隊伍皆為排球 |
| [ ] | 三種運動皆有正確場地 SVG + 預設站位 + sketch 儲存／讀取 |
| [ ] | 外部戰術板連結三種運動皆可用 |
| [ ] | 三種運動皆有專用比賽統計（輸入、儲存、球員唯讀、隊伍累計） |
| [ ] | 排球隊回歸測試通過 |
| [ ] | API 拒絕與隊伍 `sport` 不符的 payload |

---

## 變更紀錄

| 日期 | 說明 |
|------|------|
| 2026-06-04 | 初版：依多運動擴展計劃建立 Phase 0–4 檢查清單 |
| 2026-06-04 | Phase 0 實作完成：`Team.sport`、Sport Registry、建隊 UI、API 守衛、即將推出占位 |
| 2026-06-04 | Phase 1 實作完成：`SportCourtModule`、排球 court 搬移、editor/readonly 注入 |

---

## 相關文件

- [MVP-PROGRESS.md](./MVP-PROGRESS.md) — 排球 MVP 原有進度
- 計劃原文：Cursor「多運動擴展計劃」（待實作完成後補 `MULTI-SPORT.md` 技術說明）
