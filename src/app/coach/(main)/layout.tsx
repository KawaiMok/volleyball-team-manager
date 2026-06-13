import { redirect } from "next/navigation";

import { CoachMainToolbar } from "@/components/coach-main-toolbar";
import { NativeAppShell } from "@/components/native-app-shell";
import { TeamSportProvider } from "@/components/team-sport-provider";
import { getSportModule } from "@/lib/sports/registry";
import { prismaSportToId } from "@/lib/sports/registry-server";
import { getSportDisplayName } from "@/lib/sports/sport-options";
import { getTeamMember, listActiveTeamsForSwitcher } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";

export default async function CoachMainLayout({ children }: { children: React.ReactNode }) {
  const member = await getTeamMember();

  if (!member) {
    redirect("/onboarding");
  }
  if (!isCoachLike(member)) {
    redirect("/coach/forbidden");
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
  const sportMod = getSportModule(sportId);

  return (
    <TeamSportProvider sport={sportId}>
      <div className="min-h-full bg-[var(--app-page-bg)] text-[var(--app-text)]">
        <CoachMainToolbar
          teamName={team.name}
          sportLabel={getSportDisplayName(sportId)}
          showLiveTactical={sportMod.capabilities.liveTactical}
          teams={teamOptions}
          currentTeamId={member.teamId}
        />
        <NativeAppShell surface="coach">
          <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
        </NativeAppShell>
      </div>
    </TeamSportProvider>
  );
}
