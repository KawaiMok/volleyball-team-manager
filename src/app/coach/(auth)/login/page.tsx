import { ClerkSignInShell } from "@/components/clerk-sign-in-shell";
import Link from "next/link";

/** 相容舊連結 `/coach/login`（註解：與 `/sign-in` 相同元件）。 */
export default async function CoachLoginRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-16">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold tracking-tight">教練端登入</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            使用 Clerk 登入；也可改用{" "}
            <Link href="/sign-in" className="text-blue-600 hover:underline">
              /sign-in
            </Link>
          </p>
        </div>

        {sp.error === "not_coach" ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            此帳號角色不符時將無法進入教練後台。
          </p>
        ) : null}

        <ClerkSignInShell fallbackRedirectUrl="/coach" rootBoxClassName="w-full" />

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          <Link href="/" className="hover:text-zinc-800 dark:text-zinc-200">
            回首頁
          </Link>
        </p>
      </div>
    </div>
  );
}
