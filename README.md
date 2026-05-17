# 排球隊管理（M1 實作）

**發佈版本：v1.0.0**

Next.js 16（App Router）+ Prisma 7 + Postgres。規格見工作區 `docs/volleyball-team-manager/`。

**正式環境部署**（Vercel + Neon、選用 Render、Clerk、Prisma、安全檢查）：見 [docs/PRODUCTION-DEPLOY.md](docs/PRODUCTION-DEPLOY.md)。

## 環境

1. 編輯 `.env`：
   - **Clerk**：在 [Clerk Dashboard](https://dashboard.clerk.com) 建立 Application，填入 `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`、`CLERK_SECRET_KEY`。
   - **Postgres**：將 `DATABASE_URL` 改成你的 **使用者、密碼**（資料庫名建議 `volleyball_team`）。勿沿用範例假字串。
2. **建立資料庫並套用結構**（含 `User.clerkUserId` migration；一次完成）：

```bash
npm run db:setup
```

等同依序：`node scripts/create-db.cjs`（若 DB 不存在則建立）→ `prisma migrate deploy`。

若只想跑 migration（資料庫已建好）：

```bash
npx prisma migrate deploy
# 本機開發也可用：npx prisma migrate dev
```

3. 安裝與開發：

```bash
npm install
npm run dev
```

`postinstall` 會執行 `prisma generate`，Client 產生在 `src/generated/prisma`（已列入 `.gitignore`）。

## 正式登入（Clerk）

- 瀏覽器：[http://localhost:3000/sign-in](http://localhost:3000/sign-in) → 登入後進入 `/coach`。
- 首次登入會依 Clerk `userId` 建立／更新 Prisma `User`；若 **Email** 與既有使用者相同（例如先前 `bootstrap` 建立的教練），會自動寫入 `clerkUserId` 並合併帳號。

## 除錯用身分（選用，API／腳本）

在 `.env` 設 `ALLOW_DEBUG_AUTH=true` 時，API 仍接受：

- Header：`x-debug-user-id`、`x-debug-team-id`
- 或舊版 cookie：`debug-user-id`、`debug-team-id`

開發建立示範資料：在 `.env` 設 `ALLOW_BOOTSTRAP=1` 後：

```bash
curl -X POST http://localhost:3000/api/bootstrap
```

回傳的 `teamId`、`coach.userId` 等即可用於後續請求 header。

### 教練端畫面（瀏覽器）

1. [登入](http://localhost:3000/sign-in)（Clerk）
2. 進入 `/coach`：總覽、事件、新增事件、詳情（發布、點名、訓練計畫／AI）
3. 若尚無 `TeamMember`：會導向 `/coach/onboarding`；角色非教練則 `/coach/forbidden`

## 主要 API

| 方法 | 路徑 | 說明 |
|------|------|------|
| `GET` | `/api/events?teamId=...` | 事件列表（教練看全部；球員看已發布且參與） |
| `POST` | `/api/events` | 建立草稿事件 + 參與者 + Attendance |
| `GET` | `/api/events/[id]` | 事件詳情 |
| `PATCH` | `/api/events/[id]/publish` | 發布 |
| `PATCH` | `/api/events/[id]/rsvp` | 球員 RSVP |
| `PATCH` | `/api/events/[id]/check-in` | 教練點名（批次） |
| `POST` | `/api/events/[id]/feedback` | 球員回饋（事件結束後；24h 內可改） |
| `GET` | `/api/events/[id]/training-plan` | 取得訓練計畫（僅 `TRAINING` 事件；讀取規則同事件詳情） |
| `POST` | `/api/events/[id]/training-plan` | 建立訓練計畫（已存在則 `409`） |
| `PUT` | `/api/events/[id]/training-plan` | 全量取代計畫與段落（無則建立） |
| `DELETE` | `/api/events/[id]/training-plan` | 刪除訓練計畫 |
| `POST` | `/api/events/[id]/training-plan/ai` | AI 產生並寫入（僅教練/管理員；需 `DEEPSEEK_API_KEY`） |

## 技術備註

- Prisma 7 需使用 `@prisma/adapter-pg` + `pg`；連線設定在 `src/lib/prisma.ts`（延遲初始化，避免未設 `DATABASE_URL` 時 `next build` 失敗）。
- Migrate 設定使用根目錄 `prisma.config.ts` 的 `datasource.url`（讀取 `DATABASE_URL`）。
- AI 使用 Vercel AI SDK（`generateObject` + `@ai-sdk/openai` 指向 DeepSeek 相容端點）；未設定 `DEEPSEEK_API_KEY` 時 AI 路由回 `503`。

### AI 請求範例

```bash
curl -X POST "http://localhost:3000/api/events/<EVENT_ID>/training-plan/ai" \
  -H "Content-Type: application/json" \
  -H "x-debug-team-id: <TEAM_ID>" \
  -H "x-debug-user-id: <COACH_USER_ID>" \
  -d '{"headcount":12,"durationMinutes":90,"skillFocus":"接發球","constraints":"半場、4顆球","replace":true}'
```
