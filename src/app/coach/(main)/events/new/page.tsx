import Link from "next/link";

import { EventCreateForm } from "@/app/coach/(main)/events/new/event-create-form";
import { parseGroupConfig } from "@/lib/group-config";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { MemberStatus } from "@/generated/prisma/client";

/** 新增事件頁：載入分組與在籍名單供參與者規則 UI（註解：對應規格 A4）。 */
export default async function CoachNewEventPage() {
  const member = await getDebugTeamMember();
  if (!member) return null;

  const prisma = getPrisma();
  const [team, rosterRows] = await Promise.all([
    prisma.team.findUnique({
      where: { id: member.teamId },
      select: { groupConfig: true },
    }),
    prisma.teamMember.findMany({
      where: { teamId: member.teamId, status: MemberStatus.ACTIVE },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const squads = parseGroupConfig(team?.groupConfig ?? null);
  const roster = rosterRows.map((r) => ({
    id: r.id,
    displayName: r.user.name ?? r.user.email ?? r.id.slice(0, 8),
    squad: r.squad,
    role: r.role,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/coach/events" className="text-sm text-blue-600 hover:underline">
          ← 返回事件列表
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">新增事件</h1>
        <p className="mt-1 text-sm text-zinc-600">建立後為草稿，可在詳情頁發布</p>
      </div>
      <EventCreateForm teamId={member.teamId} squads={squads} roster={roster} />
    </div>
  );
}
