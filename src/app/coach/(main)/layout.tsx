import Link from "next/link";
import { redirect } from "next/navigation";

import { UserButton } from "@clerk/nextjs";

import { ActiveTeamSwitcher } from "@/components/active-team-switcher";
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
    <div className="min-h-full bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {teamOptions.length > 1 ?
              <>
                <ActiveTeamSwitcher teams={teamOptions} currentTeamId={member.teamId} variant="coach" />
                <div className="flex flex-col justify-center border-l border-zinc-200 pl-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">教練端</span>
                </div>
              </>
            : (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">教練端</span>
                <span className="font-semibold text-zinc-900">{team?.name ?? "球隊"}</span>
              </div>
            )}
          </div>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link className="text-zinc-700 hover:text-zinc-900" href="/coach">
              總覽
            </Link>
            <Link className="text-zinc-700 hover:text-zinc-900" href="/coach/live-tactical">
              即時戰術版
            </Link>
            <Link className="text-zinc-700 hover:text-zinc-900" href="/coach/events">
              事件
            </Link>
            <Link className="text-zinc-700 hover:text-zinc-900" href="/coach/calendar">
              行事曆
            </Link>
            <Link className="text-zinc-700 hover:text-zinc-900" href="/coach/team">
              隊伍
            </Link>
            <Link
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800"
              href="/coach/events/new"
            >
              新增事件
            </Link>
            <UserButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
