import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { notFound, redirect } from "next/navigation";

import { AdminSidebar } from "@/components/admin/admin-sidebar";
import {
  canManageOrganization,
  getOrganizationBySlug,
  listManageableOrganizationsForUser,
} from "@/lib/platform-rbac";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";

type Props = { children: React.ReactNode; params: Promise<{ slug: string }> };

/** 組織管理 layout（註解：slug 解析 + ORG_ADMIN 或平台超管）。 */
export default async function OrgLayout({ children, params }: Props) {
  const { slug } = await params;
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    redirect(`/sign-in?dest=org&org=${slug}`);
  }

  const org = await getOrganizationBySlug(slug);
  if (!org) notFound();

  if (!(await canManageOrganization(user.id, org.id))) {
    redirect("/org/forbidden");
  }

  const manageable = await listManageableOrganizationsForUser(user.id);

  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <AdminSidebar variant="org" orgSlug={org.slug} orgName={org.name} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">{org.name}</span>
            {manageable.length > 1 ?
              <span className="flex flex-wrap gap-2 border-l border-zinc-200 pl-3 dark:border-zinc-700">
                {manageable.map((o) => (
                  <Link
                    key={o.id}
                    href={`/org/${o.slug}`}
                    className={
                      o.slug === slug ?
                        "font-medium text-[var(--brand-primary)]"
                      : "text-zinc-500 hover:underline"
                    }
                  >
                    {o.name}
                  </Link>
                ))}
              </span>
            : null}
          </div>
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
