import Link from "next/link";
import { redirect } from "next/navigation";

import { UserButton } from "@clerk/nextjs";

import { ActiveTeamSwitcher } from "@/components/active-team-switcher";
import { NativeAppShell } from "@/components/native-app-shell";
import { ToolbarUtilityDropdown } from "@/components/toolbar-utility-dropdown";
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
      select: { name: true },
    }),
    listActiveTeamsForSwitcher(),
  ]);

  const showCoachBanner = isCoachLike(member);
  /** 教練兼球員：同時具球員身分與教練端權限（註解：與僅預覽的純教練文案區分）。 */
  const isCoachPlayerDual = isPlayer(member) && isCoachLike(member);

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      {showCoachBanner ?
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100">
          {isCoachPlayerDual ?
            <>
              你為<strong className="font-semibold">教練兼球員</strong>；此處為球員視角（行程、RSVP 等）。若要管理隊務請至{" "}
              <Link className="font-medium underline" href="/coach">
                教練端
              </Link>
              。
            </>
          : <>
              你目前身分為教練／管理員，若要管理隊務請至{" "}
              <Link className="font-medium underline" href="/coach">
                教練端
              </Link>
              ；此處為球員視角預覽。
            </>
          }
        </div>
      : null}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/95 dark:backdrop-blur-md">
        <div className="mx-auto flex max-w-lg flex-wrap items-center justify-between gap-4 px-4 py-3 sm:max-w-2xl">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            {teamOptions.length > 1 ?
              <>
                <ActiveTeamSwitcher teams={teamOptions} currentTeamId={member.teamId} variant="player" />
                <div className="flex flex-col justify-center border-l border-slate-200 dark:border-slate-700 pl-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">球員端</span>
                </div>
              </>
            : (
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">球員端</span>
                <span className="font-semibold text-slate-900 dark:text-slate-50">{team?.name ?? "球隊"}</span>
              </div>
            )}
          </div>
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:gap-x-4">
            <Link
              className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              href="/player"
            >
              我的行程
            </Link>
            <Link
              className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              href="/player/feedback"
            >
              我的回饋
            </Link>
            <Link
              className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              href="/player/notifications"
            >
              通知
            </Link>
            {/** 註解：與教練端一致—齒輪下拉內含端別與外觀；純球員僅見外觀。 */}
            <ToolbarUtilityDropdown surface="player" currentView="player" canAccessCoach={isCoachLike(member)} />
            <UserButton />
          </nav>
        </div>
      </header>
      <NativeAppShell surface="player" canAccessCoach={isCoachLike(member)} canAccessPlayer={false}>
        <div className="mx-auto max-w-lg px-4 py-8 sm:max-w-2xl">{children}</div>
      </NativeAppShell>
    </div>
  );
}
