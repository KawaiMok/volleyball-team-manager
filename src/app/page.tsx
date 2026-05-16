import Link from "next/link";

import { ActiveTeamSwitcher } from "@/components/active-team-switcher";
import { getTeamMember, listActiveTeamsForSwitcher } from "@/lib/session";

/**
 * 落地首頁：選擇教練端或球員端再登入；已登入則直入對應區（註解：`?dest=` 見 sign-in／sign-up）。
 */
export default async function Home() {
  const member = await getTeamMember();
  const teamOptions = member ? await listActiveTeamsForSwitcher() : [];

  const signedIn = Boolean(member);
  const coachHref = signedIn ? "/coach" : "/sign-in?dest=coach";
  const playerHref = signedIn ? "/player" : "/sign-in?dest=player";
  const signUpCoach = "/sign-up?dest=coach";
  const signUpPlayer = "/sign-up?dest=player";

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:py-16">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">排球隊管理</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {signedIn ?
            <>已登入。請選擇要使用的介面。</>
          : <>
              請先選擇介面，將引導你登入；首次使用請註冊並確認信箱與隊務登記一致。
            </>
          }
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={coachHref}
          className="group flex flex-col rounded-2xl border-2 border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-400 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500"
        >
          <span className="text-2xl" aria-hidden>
            📋
          </span>
          <span className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">教練端</span>
          <span className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            總覽、行事曆、事件、隊伍與點名等管理功能。
          </span>
          <span className="mt-4 text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
            {signedIn ? "進入教練端 →" : "登入教練端 →"}
          </span>
        </Link>
        <Link
          href={playerHref}
          className="group flex flex-col rounded-2xl border-2 border-zinc-200 bg-white p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-violet-600"
        >
          <span className="text-2xl" aria-hidden>
            🏐
          </span>
          <span className="mt-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">球員端</span>
          <span className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            我的行程、RSVP、場次與身體回饋等參與者視角。
          </span>
          <span className="mt-4 text-sm font-medium text-blue-600 group-hover:underline dark:text-blue-400">
            {signedIn ? "進入球員端 →" : "登入球員端 →"}
          </span>
        </Link>
      </div>

      {!signedIn ?
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          尚無帳號？可註冊後再選端：
          <Link className="font-medium text-blue-600 hover:underline dark:text-blue-400" href={signUpCoach}>
            註冊（教練）
          </Link>
          {" · "}
          <Link className="font-medium text-blue-600 hover:underline dark:text-blue-400" href={signUpPlayer}>
            註冊（球員）
          </Link>
        </p>
      : null}

      {member && teamOptions.length > 1 ?
        <section className="rounded-lg border border-violet-200 bg-violet-50/60 p-4 text-sm shadow-sm dark:border-violet-900/50 dark:bg-violet-950/30">
          <div className="flex flex-wrap items-start gap-4">
            <ActiveTeamSwitcher teams={teamOptions} currentTeamId={member.teamId} variant="coach" />
            <div className="min-w-0 flex-1 border-l border-violet-200 pl-4 dark:border-violet-800">
              <h2 className="font-medium text-violet-950 dark:text-violet-100">作用中隊伍</h2>
              <p className="mt-1 text-xs text-violet-900/80 dark:text-violet-200/80">
                會影響教練端／球員端讀取的資料（cookie{" "}
                <code className="rounded bg-white px-1 dark:bg-zinc-900/80">active-team-id</code>）。
              </p>
            </div>
          </div>
        </section>
      : null}

      <details className="rounded-lg border border-zinc-200 bg-zinc-50/80 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
        <summary className="cursor-pointer select-none px-4 py-3 font-medium text-zinc-800 dark:text-zinc-200">
          環境與開發說明
        </summary>
        <div className="space-y-4 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <p>
            後端為 Next.js + Prisma + Postgres；正式登入為{" "}
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">Clerk</strong>。若 Bootstrap 使用者 Email 與 Clerk
            相同，首次登入會合併同一筆 <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">User</code>。
          </p>
          <section>
            <h3 className="font-medium text-zinc-800 dark:text-zinc-200">訓練計畫 API</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 font-mono text-xs">
              <li>GET/POST/PUT/DELETE /api/events/[id]/training-plan</li>
              <li>POST /api/events/[id]/training-plan/ai（需 DEEPSEEK_API_KEY）</li>
            </ul>
          </section>
          <section>
            <h3 className="font-medium text-zinc-800 dark:text-zinc-200">快速步驟</h3>
            <ol className="mt-2 list-decimal space-y-2 pl-5">
              <li>
                設定 <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env</code>：{" "}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">DATABASE_URL</code>、Clerk 金鑰（見{" "}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.example</code>）
              </li>
              <li>
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">npm run db:setup</code> 套用資料表
              </li>
              <li>
                開發可設 <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">ALLOW_BOOTSTRAP=1</code>，POST{" "}
                <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/api/bootstrap</code>
              </li>
              <li className="text-zinc-500">
                （選）<code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">ALLOW_DEBUG_AUTH=true</code> 除錯用
              </li>
            </ol>
          </section>
          <p className="text-xs">
            規格：<code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">docs/volleyball-team-manager/</code>
          </p>
        </div>
      </details>
    </main>
  );
}
