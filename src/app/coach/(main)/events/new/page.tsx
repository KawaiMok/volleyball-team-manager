import Link from "next/link";

import { EventCreateForm } from "@/app/coach/(main)/events/new/event-create-form";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { CopyLastTrainingButton } from "@/components/event-duplicate-actions";
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
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">新增事件</h1>
          <HintExclamationToggle>建立後為草稿，可在詳情頁發布。</HintExclamationToggle>
        </div>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          每週固定練習可一鍵複製最近一場訓練（含參與者、訓練計畫、企位與戰術／影片連結，時間 +7 天）。
        </p>
        <div className="mt-3">
          <CopyLastTrainingButton />
        </div>
      </div>
      <EventCreateForm teamId={member.teamId} squads={squads} roster={roster} />
    </div>
  );
}
