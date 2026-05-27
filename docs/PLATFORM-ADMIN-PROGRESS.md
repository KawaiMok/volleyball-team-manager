# Platform Admin 多租戶 — 進度追蹤

> 對照計畫：`.cursor/plans/platform_admin_多租戶_b136d535.plan.md`  
> 規格說明：[`docs/PLATFORM-ADMIN.md`](PLATFORM-ADMIN.md)

**最後更新**：2026-05-23（Phase 1 MVP 已完成，`npm run build` 通過）

---

## 圖例

- `[x]` 已完成
- `[ ]` 未開始
- `[~]` 進行中

---

## 第一階段：資料層

| 狀態 | 項目 |
|------|------|
| [x] | Prisma：`Organization`、`OrganizationMember`、`PlatformAdmin`、`PlatformAuditLog` |
| [x] | `Team.organizationId`、`Team.lifecycleStatus` |
| [x] | Migration + backfill 預設組織「慈青體育會」（slug: `aaaism`） |
| [x] | `PLATFORM_ADMIN_EMAILS` 環境變數（`.env.example`） |

---

## 第二階段：共用邏輯

| 狀態 | 項目 |
|------|------|
| [x] | `src/lib/platform-rbac.ts` — 三層權限 |
| [x] | `src/lib/team-provisioning.ts` — 依 Email 建 User + TeamMember |
| [x] | `/api/team/members` 共用 `findOrCreateUserByEmail` |

---

## 第三階段：API

| 狀態 | 項目 |
|------|------|
| [x] | `GET/POST /api/platform/organizations` |
| [x] | `GET/PATCH /api/platform/organizations/[id]` |
| [x] | `POST /api/platform/organizations/[id]/members` |
| [x] | `GET /api/platform/stats` |
| [x] | `GET/POST /api/org/[orgId]/teams` |
| [x] | `PATCH /api/org/[orgId]/teams/[teamId]` |
| [x] | `POST /api/org/[orgId]/teams/[teamId]/coaches` |
| [x] | `GET/POST /api/org/[orgId]/members` |
| [x] | `GET /api/org/[orgId]/stats` |

---

## 第四階段：Platform UI（`/platform/*`）

| 狀態 | 項目 |
|------|------|
| [x] | Sidebar layout + forbidden 頁 |
| [x] | `/platform` 總覽 |
| [x] | `/platform/organizations` 列表 |
| [x] | `/platform/organizations/new` 建立 |
| [x] | `/platform/organizations/[id]` 詳情 |

---

## 第五階段：Org UI（`/org/[slug]/*`）

| 狀態 | 項目 |
|------|------|
| [x] | Org layout + slug 解析 |
| [x] | `/org/[slug]` 儀表板 |
| [x] | `/org/[slug]/teams/new` 建隊 + 指派教練 |
| [x] | `/org/[slug]/teams/[teamId]` 球隊詳情 |
| [x] | `/org/[slug]/members` 組織管理員 |

---

## 第六階段：整合

| 狀態 | 項目 |
|------|------|
| [x] | Middleware：`/platform`、`/org` 保護 |
| [x] | 首頁：平台／組織管理入口 |
| [x] | `/onboarding` 引導 ORG_ADMIN 建隊 |
| [x] | `.env.example` 更新 |
| [x] | `docs/PLATFORM-ADMIN.md` 開通 SOP |

---

## 驗收清單

- [ ] 平台超管可建立組織並指派 ORG_ADMIN（需你設定 `PLATFORM_ADMIN_EMAILS` 後手動驗收）
- [ ] ORG_ADMIN 可建隊並依 Email 指派教練
- [ ] 教練 Clerk 登入後進入 `/coach`
- [x] 現有球隊 migration 後歸屬預設組織
- [x] 未授權存取 `/platform`、`/org/*` 回 forbidden

---

## Phase 2 待辦（尚未開始）

- [ ] 審計 log UI（`PlatformAuditLog` 已寫入）
- [ ] 球隊 `ARCHIVED` 後教練端限制
- [ ] Clerk Invitation 邀請信
- [ ] 組織 branding / CSV 匯入

---

## 備註

- Admin UI 採桌面 sidebar，教練／球員端維持行動優先。
- 請在本機 `.env` 加入：`PLATFORM_ADMIN_EMAILS=你的Clerk信箱`
