import Link from "next/link";
import { notFound } from "next/navigation";

import { getOrganizationBySlug } from "@/lib/platform-rbac";
import { getPrisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

/** 組織儀表板。 */
export default async function OrgDashboardPage({ params }: Props) {
  const { slug } = await params;
  const org = await getOrganizationBySlug(slug);
  if (!org) notFound();

  const prisma = getPrisma();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [teamCount, orgMemberCount, eventCountRecent, teams] = await Promise.all([
    prisma.team.count({ where: { organizationId: org.id } }),
    prisma.organizationMember.count({ where: { organizationId: org.id, status: "ACTIVE" } }),
    prisma.event.count({
      where: { team: { organizationId: org.id }, startsAt: { gte: since } },
    }),
    prisma.team.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { members: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{org.name}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">組織營運儀表板</p>
        </div>
        <Link
          href={`/org/${slug}/teams/new`}
          className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          建立球隊
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "球隊數", value: teamCount },
          { label: "組織管理員", value: orgMemberCount },
          { label: "近 30 日活動", value: eventCountRecent },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">球隊列表</h2>
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {teams.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-zinc-500">
                  {t.season ?? "—"} · {t._count.members} 人 · {t.lifecycleStatus}
                </p>
              </div>
              <Link
                href={`/org/${slug}/teams/${t.id}`}
                className="text-[var(--brand-primary)] hover:underline"
              >
                管理
              </Link>
            </li>
          ))}
          {teams.length === 0 ?
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              尚無球隊。
              <Link href={`/org/${slug}/teams/new`} className="ml-1 text-[var(--brand-primary)] hover:underline">
                立即建立
              </Link>
            </li>
          : null}
        </ul>
      </section>
    </div>
  );
}
