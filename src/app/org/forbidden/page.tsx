import Link from "next/link";

/** 組織後台：無權限提示。 */
export default function OrgForbiddenPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-4 py-16 text-center">
      <h1 className="text-xl font-semibold">無組織管理權限</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        你的帳號尚未被指派為此組織的管理員。請聯絡平台營運方或既有 ORG_ADMIN。
      </p>
      <Link href="/" className="text-sm text-[var(--brand-primary)] hover:underline">
        回首頁
      </Link>
    </div>
  );
}
