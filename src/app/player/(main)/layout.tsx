import { redirect } from "next/navigation";

import { NativeAppShell } from "@/components/native-app-shell";
import { PlayerMainToolbar } from "@/components/player-main-toolbar";
import { TeamSportProvider } from "@/components/team-sport-provider";
import { prismaSportToId } from "@/lib/sports/registry-server";
import { getSportDisplayName } from "@/lib/sports/sport-options";
import { getTeamMember, listActiveTeamsForSwitcher } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike, isPlayer } from "@/lib/rbac";

export default async function PlayerMainLayout({ children }: { children: React.ReactNode }) {
  const member = await getTeamMember();

  if (!member) {
    redirect("/onboarding");
  }
  /** 球員端：PLAYER／COACH_PLAYER，以及「預覽球員畫面」的 ADMIN/COACH（註解：勿再把教練強制踢回 /coach）。 */
  const canUsePlayerUi = isPlayer(member) || isCoachLike(member);
  if (!canUsePlayerUi) {
    redirect("/player/forbidden");
  }

  const [team, teamOptions] = await Promise.all([
    getPrisma().team.findUnique({
      where: { id: member.teamId },
      select: { name: true, sport: true },
    }),
    listActiveTeamsForSwitcher(),
  ]);

  if (!team) {
    redirect("/onboarding");
  }

  const sportId = prismaSportToId(team.sport);

  return (
    <TeamSportProvider sport={sportId}>
      <div className="min-h-full bg-[var(--app-page-bg)] text-[var(--app-text)]">
        <PlayerMainToolbar
          teamName={team.name}
          sportLabel={getSportDisplayName(sportId)}
          teams={teamOptions}
          currentTeamId={member.teamId}
          canAccessCoach={isCoachLike(member)}
        />
        <NativeAppShell surface="player">
          <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-2xl">{children}</div>
        </NativeAppShell>
      </div>
    </TeamSportProvider>
  );
}
