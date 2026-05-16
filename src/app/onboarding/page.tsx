import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { ClaimDemoTeamButtons } from "@/app/onboarding/claim-buttons";
import { isBootstrapAccessEnabled } from "@/lib/bootstrap-access";

/** 已登入但尚無 TeamMember（註解：教練／球員共用）。 */
export default function OnboardingPage() {
  const allowClaim = isBootstrapAccessEnabled();

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
      <section className="space-y-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 text-sm text-zinc-700 dark:text-zinc-300">
        <h2 className="font-medium text-zinc-900 dark:text-zinc-50">常見原因</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">Email 不一致</strong>：若隊務事先在資料庫建立使用者，系統會依{" "}
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">Clerk 帳號的主要 Email</strong>{" "}
            與該筆資料合併；請確認兩邊信箱相同（含大小寫／別名）。
          </li>
          <li>
            <strong className="font-medium text-zinc-800 dark:text-zinc-200">尚未建立隊籍</strong>：正式流程需管理員／隊務為你建立隊伍與成員身分。
          </li>
        </ul>
      </section>
      {allowClaim ?
        <ClaimDemoTeamButtons />
      : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          正式環境請由<strong className="font-medium text-zinc-700 dark:text-zinc-300">隊務／教練</strong>在教練端「隊伍／隊員」依你的 Email
          建立隊籍；請確認 Clerk 登入信箱與隊務登記一致。開發環境可設{" "}
          <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">ALLOW_BOOTSTRAP=1</code>{" "}
          （且非 <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">APP_ENV=production</code>／Vercel Production）以顯示示範隊按鈕。
        </p>
      )}
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        回首頁
      </Link>
    </div>
  );
}

