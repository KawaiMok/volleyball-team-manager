import Link from "next/link";
import { notFound } from "next/navigation";

import { AddCoachForm } from "@/components/admin/add-coach-form";
import { getOrganizationBySlug } from "@/lib/platform-rbac";
import { getPrisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string; teamId: string }> };

/** 組織：球隊詳情與教練名單。 */
export default async function OrgTeamDetailPage({ params }: Props) {
  const { slug, teamId } = await params;
  const org = await getOrganizationBySlug(slug);
  if (!org) notFound();

  const prisma = getPrisma();
  const team = await prisma.team.findFirst({
    where: { id: teamId, organizationId: org.id },
    include: {
      members: {
        where: { status: "ACTIVE" },
        include: { user: { select: { id: true, email: true, name: true, clerkUserId: true } } },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      },
      _count: { select: { events: true } },
    },
  });

  if (!team) notFound();

  const coaches = team.members.filter((m) =>
    ["ADMIN", "COACH", "COACH_PLAYER", "STAFF"].includes(m.role),
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <Link href={`/org/${slug}`} className="text-sm text-zinc-500 hover:underline">
          ← 返回儀表板
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{team.name}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {team.season ?? "—"} · {team.lifecycleStatus} · {team._count.events} 場活動
        </p>
      </div>

      <AddCoachForm orgId={org.id} teamId={team.id} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">教練／管理員</h2>
        <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {coaches.map((m) => (
            <li key={m.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <p className="font-medium">{m.user.name ?? "（未命名）"}</p>
                <p className="text-zinc-500">{m.user.email}</p>
              </div>
              <div className="text-right text-xs text-zinc-500">
                <p>{m.role}</p>
                <p>{m.user.clerkUserId ? "已連結 Clerk" : "待登入合併"}</p>
              </div>
            </li>
          ))}
          {coaches.length === 0 ?
            <li className="px-4 py-6 text-center text-sm text-zinc-500">尚無教練，請上方新增。</li>
          : null}
        </ul>
      </section>

      <p className="text-xs text-zinc-500">
        教練登入後請至{" "}
        <Link href="/coach" className="text-[var(--brand-primary)] hover:underline">
          教練端
        </Link>{" "}
        管理事件與隊員；若看不到球隊，請確認 Clerk Email 與上方信箱一致。
      </p>
    </div>
  );
}
