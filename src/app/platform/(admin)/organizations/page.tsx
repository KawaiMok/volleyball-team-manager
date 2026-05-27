import Link from "next/link";

import { getPrisma } from "@/lib/prisma";

/** 平台：組織列表。 */
export default async function PlatformOrganizationsPage() {
  const prisma = getPrisma();
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { teams: true, members: true } } },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">組織管理</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">所有租戶組織與旗下球隊概況。</p>
        </div>
        <Link
          href="/platform/organizations/new"
          className="shrink-0 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          新增組織
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            <tr>
              <th className="px-4 py-3">名稱</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">狀態</th>
              <th className="px-4 py-3">球隊</th>
              <th className="px-4 py-3">成員</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {orgs.map((o) => (
              <tr key={o.id} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                <td className="px-4 py-3 font-medium">{o.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{o.slug}</td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3 tabular-nums">{o._count.teams}</td>
                <td className="px-4 py-3 tabular-nums">{o._count.members}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/platform/organizations/${o.id}`}
                    className="text-[var(--brand-primary)] hover:underline"
                  >
                    詳情
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orgs.length === 0 ?
          <p className="p-6 text-center text-sm text-zinc-500">尚無組織，請先新增。</p>
        : null}
      </div>
    </div>
  );
}
