import { ClerkSignInShell } from "@/components/clerk-sign-in-shell";
import { postAuthPathFromDest } from "@/lib/auth-landing-dest";

type SearchProps = {
  searchParams: Promise<{ dest?: string }>;
};

/**
 * Clerk 登入（註解：`?dest=coach`|`player` 決定登入成功後預設導向；否則回首頁落地選端）。
 */
export default async function SignInPage({ searchParams }: SearchProps) {
  const { dest } = await searchParams;
  const fallbackRedirectUrl = postAuthPathFromDest(dest);

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <ClerkSignInShell fallbackRedirectUrl={fallbackRedirectUrl} />
    </div>
  );
}

