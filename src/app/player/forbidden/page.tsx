import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

/** 非球員角色進入球員區（註解：例如隊務／助教）。 */
export default function PlayerForbiddenPage() {
  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">此區僅限球員</h1>
        <UserButton />
      </div>
      <p className="text-sm text-slate-600">
        你的身分不是「球員」，請使用教練端或其他入口。
      </p>
      <Link href="/coach" className="text-sm text-blue-600 hover:underline">
        前往教練端（若你有權限）
      </Link>
      <Link href="/" className="text-sm text-slate-500 hover:underline">
        回首頁
      </Link>
    </div>
  );
}
