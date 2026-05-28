import Link from "next/link";

import { CoachTeamIdentitySettingsForm } from "@/app/coach/(main)/team/coach-team-identity-settings-form";
import { CoachTeamRolesEmailPanel } from "@/app/coach/(main)/team/coach-team-roles-email-panel";
import { TeamAttendanceStats } from "@/app/coach/(main)/team/team-attendance-stats";
import { TeamPageMembers } from "@/app/coach/(main)/team/team-page-members";
import { computeTeamAttendanceStats } from "@/lib/attendance-stats";
import { mapTeamMemberToRosterRow } from "@/lib/team-roster-map";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { CoachEventDetailCollapsibleSection } from "@/components/coach-event-detail-collapsible-section";
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
  const [teamRow, rows, initialAttendanceStats] = await Promise.all([
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
    computeTeamAttendanceStats(member.teamId, "month"),
  ]);
  const squads = parseGroupConfig(teamRow?.groupConfig ?? null);
  const notificationPrefs = parseTeamNotificationSettings(teamRow?.notificationSettings ?? null);
  const actorIsAdmin = member.role === TeamRole.ADMIN;

  /** 切換作用中隊伍時強制重掛 client 表單（註解：defaultValue／useState 初值不會隨 router.refresh 自動更新）。 */
  const teamSettingsKey = member.teamId;

  const rosterRows = rows.map((r) => mapTeamMemberToRosterRow({ ...r, updatedAt: r.updatedAt }));

  return (
    <div className="space-y-10">
      <div>
        <Link href="/coach" className="text-sm text-blue-600 hover:underline">
          ← 總覽
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight">隊伍／隊員</h1>
          <HintExclamationToggle>
            依對方 <strong className="font-medium text-zinc-800 dark:text-zinc-200">Clerk 登入信箱</strong>{" "}
            建立隊籍；對方首次登入後會與此 Email 合併。正式環境請勿仰賴 Bootstrap。
          </HintExclamationToggle>
        </div>
      </div>

      <CoachEventDetailCollapsibleSection
        id="coach-team-settings"
        title="隊伍設定"
        defaultOpen={false}
        titleExtra={
          <HintExclamationToggle>隊名、賽季與分組會影響標題列與行事曆／事件篩選。</HintExclamationToggle>
        }
      >
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          <CoachTeamIdentitySettingsForm
            key={teamSettingsKey}
            initialName={teamRow?.name ?? ""}
            initialSeason={teamRow?.season ?? ""}
            initialGroupLines={squads.join("\n")}
          />
          <div className="lg:border-l lg:border-zinc-100 lg:pl-10 dark:lg:border-zinc-800">
            <CoachTeamRolesEmailPanel key={teamSettingsKey} initialNotifications={notificationPrefs} />
          </div>
        </div>
      </CoachEventDetailCollapsibleSection>

      <CoachEventDetailCollapsibleSection id="coach-team-attendance" title="出席率統計" defaultOpen={false}>
        <TeamAttendanceStats key={`${teamSettingsKey}-attendance`} initialData={initialAttendanceStats} embedded />
      </CoachEventDetailCollapsibleSection>

      <TeamPageMembers
        key={teamSettingsKey}
        initialRows={rosterRows}
        squads={squads}
        currentMemberId={member.id}
        actorIsAdmin={actorIsAdmin}
      />
    </div>
  );
}
