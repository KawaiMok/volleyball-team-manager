import Link from "next/link";
import { notFound } from "next/navigation";

import { AddOrgMemberForm } from "@/components/admin/add-org-member-form";
import { getPrisma } from "@/lib/prisma";

type Props = { params: Promise<{ id: string }> };

/** 平台：組織詳情。 */
export default async function PlatformOrganizationDetailPage({ params }: Props) {
  const { id } = await params;
  const prisma = getPrisma();
  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, email: true, name: true, clerkUserId: true } } },
      },
      teams: {
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, season: true, lifecycleStatus: true, _count: { select: { members: true } } },
      },
    },
  });

  if (!org) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{org.name}</h1>
          <p className="mt-1 font-mono text-sm text-zinc-500">/org/{org.slug}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            狀態：{org.status}
            {org.contactEmail ? ` · ${org.contactEmail}` : ""}
          </p>
        </div>
        <Link
          href={`/org/${org.slug}`}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          進入組織後台
        </Link>
      </div>

      <AddOrgMemberForm
        organizationId={org.id}
        apiPath={`/api/platform/organizations/${org.id}/members`}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">組織管理員</h2>
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {org.members.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{m.user.name ?? "（未命名）"}</p>
                <p className="text-zinc-500">{m.user.email}</p>
              </div>
              <span className="text-xs text-zinc-500">{m.role}</span>
            </li>
          ))}
          {org.members.length === 0 ?
            <li className="px-4 py-6 text-center text-sm text-zinc-500">尚無組織管理員</li>
          : null}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">旗下球隊</h2>
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {org.teams.map((t) => (
            <li key={t.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-zinc-500">
                  {t.season ?? "—"} · {t._count.members} 人 · {t.lifecycleStatus}
                </p>
              </div>
              <Link
                href={`/org/${org.slug}/teams/${t.id}`}
                className="text-[var(--brand-primary)] hover:underline"
              >
                詳情
              </Link>
            </li>
          ))}
          {org.teams.length === 0 ?
            <li className="px-4 py-6 text-center text-sm text-zinc-500">尚無球隊</li>
          : null}
        </ul>
      </section>
    </div>
  );
}
