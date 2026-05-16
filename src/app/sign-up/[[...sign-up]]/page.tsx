import { SignUp } from "@clerk/nextjs";

import { postAuthPathFromDest } from "@/lib/auth-landing-dest";

type SearchProps = {
  searchParams: Promise<{ dest?: string }>;
};

/**
 * Clerk 註冊（註解：與 sign-in 相同 `?dest=` 行為）。
 */
export default async function SignUpPage({ searchParams }: SearchProps) {
  const { dest } = await searchParams;
  const fallbackRedirectUrl = postAuthPathFromDest(dest);

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-zinc-950">
      <SignUp
        fallbackRedirectUrl={fallbackRedirectUrl}
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
      />
    </div>
  );
}
