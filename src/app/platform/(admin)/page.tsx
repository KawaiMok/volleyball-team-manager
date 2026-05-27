import Link from "next/link";

import { getPrisma } from "@/lib/prisma";

/** 平台總覽（註解：統計卡片 + 快捷連結）。 */
export default async function PlatformDashboardPage() {
  const prisma = getPrisma();
  const since = new Date();
  since.setDate(since.getDate() - 7);

  const [organizationCount, teamCount, userCount, recentOrgs, recentTeams] = await Promise.all([
    prisma.organization.count(),
    prisma.team.count(),
    prisma.user.count(),
    prisma.organization.count({ where: { createdAt: { gte: since } } }),
    prisma.team.count({ where: { createdAt: { gte: since } } }),
  ]);

  const cards = [
    { label: "組織總數", value: organizationCount },
    { label: "球隊總數", value: teamCount },
    { label: "使用者總數", value: userCount },
    { label: "近 7 日新建組織", value: recentOrgs },
    { label: "近 7 日新建球隊", value: recentTeams },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">平台總覽</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">跨組織營運數據與快捷入口。</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/platform/organizations/new"
          className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          新增組織
        </Link>
        <Link
          href="/platform/organizations"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          管理組織
        </Link>
      </div>
    </div>
  );
}
