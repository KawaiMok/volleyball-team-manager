import { notFound } from "next/navigation";

import { AddOrgMemberForm } from "@/components/admin/add-org-member-form";
import { getOrganizationBySlug } from "@/lib/platform-rbac";
import { getPrisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

/** 組織：成員管理。 */
export default async function OrgMembersPage({ params }: Props) {
  const { slug } = await params;
  const org = await getOrganizationBySlug(slug);
  if (!org) notFound();

  const prisma = getPrisma();
  const members = await prisma.organizationMember.findMany({
    where: { organizationId: org.id, status: "ACTIVE" },
    include: { user: { select: { id: true, email: true, name: true, clerkUserId: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">組織成員</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          ORG_ADMIN 可在此組織內建立球隊並指派教練。
        </p>
      </div>

      <AddOrgMemberForm organizationId={org.id} apiPath={`/api/org/${org.id}/members`} />

      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {members.map((m) => (
          <li key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{m.user.name ?? "（未命名）"}</p>
              <p className="text-zinc-500">{m.user.email}</p>
            </div>
            <span className="text-xs text-zinc-500">{m.role}</span>
          </li>
        ))}
        {members.length === 0 ?
          <li className="px-4 py-6 text-center text-sm text-zinc-500">尚無成員</li>
        : null}
      </ul>
    </div>
  );
}
