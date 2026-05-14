import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

/** 非教練／管理員進入教練區（註解：角色不符時由 layout redirect）。 */
export default function CoachForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">無權限</h1>
        <UserButton />
      </div>
      <p className="text-sm text-zinc-600">
        此帳號在隊伍中的角色不是教練或管理員，無法使用教練端。
      </p>
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        回首頁
      </Link>
    </div>
  );
}
