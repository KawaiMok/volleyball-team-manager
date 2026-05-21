import { redirect } from "next/navigation";

import { CoachMainToolbar } from "@/components/coach-main-toolbar";
import { NativeAppShell } from "@/components/native-app-shell";
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
      select: { name: true },
    }),
    listActiveTeamsForSwitcher(),
  ]);

  return (
    <div className="min-h-full bg-[var(--app-page-bg)] text-[var(--app-text)]">
      <CoachMainToolbar
        teamName={team?.name ?? "球隊"}
        teams={teamOptions}
        currentTeamId={member.teamId}
      />
      <NativeAppShell surface="coach">
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
      </NativeAppShell>
    </div>
  );
}
