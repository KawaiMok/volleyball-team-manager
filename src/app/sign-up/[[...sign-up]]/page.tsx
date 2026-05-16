import { SignUp } from "@clerk/nextjs";

/** Clerk 註冊（註解：預設回首頁再選入口；球員／教練皆可）。 */
export default function SignUpPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-16">
      <SignUp
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
