import Link from "next/link";

import { CoachTeamIdentitySettingsForm } from "@/app/coach/(main)/team/coach-team-identity-settings-form";
import { CoachTeamRolesEmailPanel } from "@/app/coach/(main)/team/coach-team-roles-email-panel";
import { AddTeamMemberForm } from "@/app/coach/(main)/team/add-member-form";
import { TeamRosterSection } from "@/app/coach/(main)/team/team-roster-section";
import { TeamRole } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { parseGroupConfig } from "@/lib/group-config";
import { getPrisma } from "@/lib/prisma";
import { parseTeamNotificationSettings } from "@/lib/team-notification-settings";

/** 隊伍／隊員：列表 + 依 Email 建隊籍（註解：編輯隊員改為全螢幕對話框，避免表單擠在表格內）。 */
export default async function CoachTeamPage() {
  const member = await getDebugTeamMember();
  if (!member) return null;

  const prisma = getPrisma();
  const [teamRow, rows] = await Promise.all([
    prisma.team.findUnique({
      where: { id: member.teamId },
      select: { name: true, season: true, groupConfig: true, notificationSettings: true },
    }),
    prisma.teamMember.findMany({
      where: { teamId: member.teamId },
      include: {
        user: { select: { email: true, name: true, clerkUserId: true } },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const squads = parseGroupConfig(teamRow?.groupConfig ?? null);
  const notificationPrefs = parseTeamNotificationSettings(teamRow?.notificationSettings ?? null);
  const actorIsAdmin = member.role === TeamRole.ADMIN;

  /** 切換作用中隊伍時強制重掛 client 表單（註解：defaultValue／useState 初值不會隨 router.refresh 自動更新）。 */
  const teamSettingsKey = member.teamId;

  const rosterRows = rows.map((r) => ({
    id: r.id,
    updatedAt: r.updatedAt.toISOString(),
    displayName: r.user.name,
    email: r.user.email,
    clerkLinked: Boolean(r.user.clerkUserId),
    role: r.role,
    status: r.status,
    jerseyNumber: r.jerseyNumber,
    position: r.position,
    squad: r.squad,
    phone: r.phone,
    notes: r.notes,
  }));

  return (
    <div className="space-y-10">
      <div>
        <Link href="/coach" className="text-sm text-blue-600 hover:underline">
          ← 總覽
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">隊伍／隊員</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          依對方 <strong className="font-medium text-zinc-800 dark:text-zinc-200">Clerk 登入信箱</strong>{" "}
          建立隊籍；對方首次登入後會與此 Email 合併。正式環境請勿仰賴 Bootstrap。
        </p>
      </div>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">隊伍設定</h2>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">隊名、賽季與分組會影響標題列與行事曆／事件篩選。</p>
        <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-10">
          <CoachTeamIdentitySettingsForm
            key={teamSettingsKey}
            initialName={teamRow?.name ?? ""}
            initialSeason={teamRow?.season ?? ""}
            initialGroupLines={squads.join("\n")}
          />
          <div className="lg:border-l lg:border-zinc-100 lg:pl-10">
            <CoachTeamRolesEmailPanel key={teamSettingsKey} initialNotifications={notificationPrefs} />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">新增隊員／隊務</h2>
        <div className="mt-4">
          <AddTeamMemberForm key={teamSettingsKey} squads={squads} actorIsAdmin={actorIsAdmin} />
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">目前名單</h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">點「編輯」於大視窗修改資料；手機由下往上滑出面板，可按 ×、背景或 Esc 關閉。</p>
        </div>
        <TeamRosterSection
          key={teamSettingsKey}
          squads={squads}
          currentMemberId={member.id}
          rows={rosterRows}
          actorIsAdmin={actorIsAdmin}
        />
      </section>
    </div>
  );
}
