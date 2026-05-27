# Platform Admin 開通 SOP

> 進度追蹤：[`PLATFORM-ADMIN-PROGRESS.md`](PLATFORM-ADMIN-PROGRESS.md)

## 角色說明

| 角色 | 入口 | 能做什麼 |
|------|------|----------|
| **平台超管** | `/platform` | 建立組織、指派 ORG_ADMIN、跨組織檢視 |
| **組織管理員（ORG_ADMIN）** | `/org/{slug}` | 建立球隊、指派教練 Email |
| **隊內教練** | `/coach` | 事件、點名、隊員（既有功能） |

## 首次開通（平台營運方）

1. 在 `.env` 設定 `PLATFORM_ADMIN_EMAILS=你的Clerk信箱`
2. 重新部署或重啟 dev server
3. 以該 Email 登入 Clerk，首頁會出現「平台管理」
4. 進入 `/platform/organizations/new` 建立組織（slug 即 `/org/{slug}` URL）
5. 在組織詳情頁指派 **ORG_ADMIN**（依 Email 預建 User）

## 組織開通球隊（ORG_ADMIN）

1. 登入後首頁點「{組織名}（組織）」或 `/org/{slug}`
2. 「建立球隊」→ 填隊名、賽季、**首位教練 Email**（建議設為 ADMIN）
3. 教練以相同 Email 註冊／登入 Clerk → 自動合併 User → 進入 `/coach`

## 教練／球員加入

- 教練：由 ORG_ADMIN 在建隊時指派，或由隊內 ADMIN 在 `/coach/team` 依 Email 新增
- 球員：教練在 `/coach/team` 依 Email 新增；球員 Clerk Email 須一致

## 環境變數

```bash
PLATFORM_ADMIN_EMAILS=admin@example.com,ops@example.com
```

## 資料遷移

既有球隊已 backfill 至預設組織 **慈青體育會**（slug: `aaaism`）。

## API 摘要

- `POST /api/platform/organizations` — 建立組織
- `POST /api/platform/organizations/[id]/members` — 指派 ORG_ADMIN
- `POST /api/org/[orgId]/teams` — 建隊 + initialCoaches
- `POST /api/org/[orgId]/teams/[teamId]/coaches` — 新增教練
