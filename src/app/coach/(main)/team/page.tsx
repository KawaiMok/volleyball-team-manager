import { CoachTeamIdentitySettingsForm } from "@/app/coach/(main)/team/coach-team-identity-settings-form";
import { CoachTeamRolesEmailPanel } from "@/app/coach/(main)/team/coach-team-roles-email-panel";
import { CoachTeamPageView } from "@/app/coach/(main)/team/coach-team-page-view";
import { TeamAttendanceStats } from "@/app/coach/(main)/team/team-attendance-stats";
import { computeTeamAttendanceStats } from "@/lib/attendance-stats";
import { mapTeamMemberToRosterRow } from "@/lib/team-roster-map";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { TeamRole } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { parseGroupConfig } from "@/lib/group-config";
import { getPrisma } from "@/lib/prisma";
import { parseTeamNotificationSettings } from "@/lib/team-notification-settings";
import { getSportModule } from "@/lib/sports/registry";
import { prismaSportToId } from "@/lib/sports/registry-server";

/** 隊伍／隊員：logo 入口 + BottomSheet（註解：對齊教練總覽儀表板）。 */
export default async function CoachTeamPage() {
  const member = await getDebugTeamMember();
  if (!member) return null;

  const prisma = getPrisma();
  const [teamRow, rows, initialAttendanceStats] = await Promise.all([
    prisma.team.findUnique({
      where: { id: member.teamId },
      select: { name: true, season: true, sport: true, groupConfig: true, notificationSettings: true },
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
  const sportModule = teamRow ? getSportModule(prismaSportToId(teamRow.sport)) : null;
  const positionOptions = sportModule?.labels.positionOptions ?? [];
  const notificationPrefs = parseTeamNotificationSettings(teamRow?.notificationSettings ?? null);
  const actorIsAdmin = member.role === TeamRole.ADMIN;
  const teamSettingsKey = member.teamId;
  const rosterRows = rows.map((r) => mapTeamMemberToRosterRow({ ...r, updatedAt: r.updatedAt }));

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">隊伍／隊員</h1>
          <HintExclamationToggle>
            點選下方入口操作。依對方 Clerk 登入信箱建立隊籍，對方首次登入後會合併。
          </HintExclamationToggle>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">隊伍管理 · {teamRow?.name ?? "—"}</p>
      </div>

      <CoachTeamPageView
        key={teamSettingsKey}
        initialRows={rosterRows}
        squads={squads}
        positionOptions={positionOptions}
        currentMemberId={member.id}
        actorIsAdmin={actorIsAdmin}
        settingsPanel={
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
            <CoachTeamIdentitySettingsForm
              key={teamSettingsKey}
              initialName={teamRow?.name ?? ""}
              initialSeason={teamRow?.season ?? ""}
              initialGroupLines={squads.join("\n")}
            />
            <div className="lg:border-l lg:border-zinc-100 lg:pl-10 dark:lg:border-zinc-800">
              <CoachTeamRolesEmailPanel key={`${teamSettingsKey}-roles`} initialNotifications={notificationPrefs} />
            </div>
          </div>
        }
        attendancePanel={
          <TeamAttendanceStats key={`${teamSettingsKey}-attendance`} initialData={initialAttendanceStats} embedded />
        }
      />
    </div>
  );
}
