import Link from "next/link";

/** 平台後台：無權限提示。 */
export default function PlatformForbiddenPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold">無平台管理權限</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        你的帳號不在平台管理員名單中。請聯絡營運方，或確認{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">PLATFORM_ADMIN_EMAILS</code>{" "}
        已包含你的 Clerk Email。
      </p>
      <Link href="/" className="text-sm text-[var(--brand-primary)] hover:underline">
        回首頁
      </Link>
    </div>
  );
}
