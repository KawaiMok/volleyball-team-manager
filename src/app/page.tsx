import Link from "next/link";

import { ActiveTeamSwitcher } from "@/components/active-team-switcher";
import { getTeamMember, listActiveTeamsForSwitcher } from "@/lib/session";

/**
 * 首頁：導向教練端與環境說明（註解：正式登入為 Clerk；腳本除錯可設 ALLOW_DEBUG_AUTH）。
 */
export default async function Home() {
  const member = await getTeamMember();
  const teamOptions = member ? await listActiveTeamsForSwitcher() : [];

  return (
    <main className="mx-auto flex min-h-full max-w-2xl flex-col gap-6 p-8 text-zinc-900 dark:text-zinc-50">
      <h1 className="text-2xl font-semibold tracking-tight">排球隊管理（M1）</h1>
      <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
        後端為 Next.js + Prisma + Postgres；教練端需{" "}
        <strong className="font-medium text-zinc-800 dark:text-zinc-200">Clerk</strong>{" "}
        登入。若你先前的 bootstrap 使用者 Email 與 Clerk 帳號相同，首次登入會自動合併到同一筆{" "}
        <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">User</code>。
      </p>
      {member && teamOptions.length > 1 ?
        <section className="rounded-lg border border-violet-200 bg-violet-50/60 p-4 text-sm shadow-sm">
          <div className="flex flex-wrap items-start gap-4">
            <ActiveTeamSwitcher teams={teamOptions} currentTeamId={member.teamId} variant="coach" />
            <div className="min-w-0 flex-1 border-l border-violet-200 pl-4">
              <h2 className="font-medium text-violet-950">作用中隊伍</h2>
              <p className="mt-1 text-xs text-violet-900/80">
                會影響教練端／球員端讀取的資料（cookie{" "}
                <code className="rounded bg-white dark:bg-zinc-900/80 px-1">active-team-id</code>）。
              </p>
            </div>
          </div>
        </section>
      : null}
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm shadow-sm">
        <h2 className="font-medium text-zinc-800 dark:text-zinc-200">教練端</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          <Link href="/sign-in" className="font-medium text-blue-600 hover:underline">
            登入（/sign-in）
          </Link>
          {" · "}
          <Link href="/coach" className="font-medium text-blue-600 hover:underline">
            進入總覽（需已登入）
          </Link>
        </p>
      </section>
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm shadow-sm">
        <h2 className="font-medium text-zinc-800 dark:text-zinc-200">球員端</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          <Link href="/player" className="font-medium text-blue-600 hover:underline">
            我的行程（需已登入且身分為球員）
          </Link>
        </p>
      </section>
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm shadow-sm">
        <h2 className="font-medium text-zinc-800 dark:text-zinc-200">訓練計畫 API</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-xs text-zinc-600 dark:text-zinc-400">
          <li>GET/POST/PUT/DELETE /api/events/[id]/training-plan</li>
          <li>POST /api/events/[id]/training-plan/ai（需 DEEPSEEK_API_KEY）</li>
        </ul>
      </section>
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm shadow-sm">
        <h2 className="font-medium text-zinc-800 dark:text-zinc-200">快速步驟</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-zinc-600 dark:text-zinc-400">
          <li>
            設定 <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">.env</code>：{" "}
            <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">DATABASE_URL</code>、Clerk 金鑰（見{" "}
            <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">.env.example</code>）
          </li>
          <li>
            <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">npm run db:setup</code> 套用資料表
          </li>
          <li>
            開發可設 <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">ALLOW_BOOTSTRAP=1</code>，POST{" "}
            <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">/api/bootstrap</code>；請用與 Clerk 相同 Email 註冊以便對應隊員資料
          </li>
          <li className="text-zinc-500 dark:text-zinc-400">
            （選）API 腳本除錯：<code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">ALLOW_DEBUG_AUTH=true</code> 時仍可用 header／debug cookie
          </li>
        </ol>
      </section>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        規格：<code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">docs/volleyball-team-manager/</code>
      </p>
    </main>
  );
}
