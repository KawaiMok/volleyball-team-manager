import { notFound } from "next/navigation";

import { CreateTeamForm } from "@/components/admin/create-team-form";
import { getOrganizationBySlug } from "@/lib/platform-rbac";

type Props = { params: Promise<{ slug: string }> };

/** 組織：建立球隊頁（註解：核心開通流程）。 */
export default async function NewTeamPage({ params }: Props) {
  const { slug } = await params;
  const org = await getOrganizationBySlug(slug);
  if (!org) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">建立球隊</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          建立後可指派教練 Email；對方 Clerk 登入後即可使用教練端。
        </p>
      </div>
      <CreateTeamForm orgId={org.id} orgSlug={slug} />
    </div>
  );
}
