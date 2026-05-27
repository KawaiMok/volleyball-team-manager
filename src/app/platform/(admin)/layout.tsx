import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { isCurrentUserPlatformAdmin } from "@/lib/platform-rbac";

/** 平台超管 layout（註解：非超管導向 forbidden）。 */
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  if (!(await isCurrentUserPlatformAdmin())) {
    redirect("/platform/forbidden");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <AdminSidebar variant="platform" />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-500">平台超管後台</p>
          <div className="flex items-center gap-4">
            <Link href="/coach" className="text-sm text-[var(--brand-primary)] hover:underline">
              教練端
            </Link>
            <UserButton />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
