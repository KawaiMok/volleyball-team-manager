import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { ClaimDemoTeamButtons } from "@/app/onboarding/claim-buttons";
import { isBootstrapAccessEnabled } from "@/lib/bootstrap-access";
import { listManageableOrganizationsForUser } from "@/lib/platform-rbac";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";

/** 已登入但尚無 TeamMember（註解：教練／球員共用；ORG_ADMIN 引導建隊）。 */
export default async function OnboardingPage() {
  const allowClaim = isBootstrapAccessEnabled();
  const user = await getOrSyncPrismaUserFromClerk();
  const orgOptions = user ? await listManageableOrganizationsForUser(user.id) : [];

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">尚未加入球隊</h1>
        <UserButton />
      </div>
      <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        你的帳號已登入，但資料庫裡還沒有<strong className="font-medium text-zinc-800 dark:text-zinc-200">作用中的隊伍成員（TeamMember）</strong>
        紀錄，因此無法進入教練端或球員端。
      </p>

      {orgOptions.length > 0 ?
        <section className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/80 p-4 text-sm dark:border-blue-900/50 dark:bg-blue-950/40">
          <h2 className="font-medium text-blue-950 dark:text-blue-100">你是組織管理員</h2>
          <p className="text-blue-900/80 dark:text-blue-200/80">
            請先建立球隊並指派教練，或為自己加入隊籍後再進入教練端。
          </p>
          <div className="flex flex-wrap gap-2">
            {orgOptions.map((o) => (
              <Link
                key={o.id}
                href={`/org/${o.slug}/teams/new`}
                className="rounded-lg bg-[var(--brand-primary)] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
              >
                在 {o.name} 建立球隊
              </Link>
            ))}
          </div>
        </section>
      : null}

      <section className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
        <h2 className="font-medium text-zinc-900 dark:text-zinc-50">常見原因</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">Email 不一致</strong>：若隊務事先在資料庫建立使用者，系統會依{" "}
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">Clerk 帳號的主要 Email</strong>{" "}
            與該筆資料合併；請確認兩邊信箱相同（含大小寫／別名）。
          </li>
          <li>
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">尚未建立隊籍</strong>：正式流程需組織管理員或教練依 Email 建立隊伍與成員身分。
          </li>
        </ul>
      </section>
      {allowClaim ?
        <ClaimDemoTeamButtons />
      : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          正式環境請由<strong className="font-medium text-zinc-700 dark:text-zinc-300">組織管理員／教練</strong>在組織後台或教練端「隊伍／隊員」依你的 Email
          建立隊籍。開發環境可設{" "}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">ALLOW_BOOTSTRAP=1</code>{" "}
          以顯示示範隊按鈕。
        </p>
      )}
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        回首頁
      </Link>
    </div>
  );
}
