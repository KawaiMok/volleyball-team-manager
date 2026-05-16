import { SignIn } from "@clerk/nextjs";

/** Clerk 登入（註解：預設回首頁再選教練／球員端，避免球員被送進教練區）。 */
export default function SignInPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-16">
      <SignIn
        fallbackRedirectUrl="/"
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
