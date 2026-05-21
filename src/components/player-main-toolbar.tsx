"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { ActiveTeamSwitcher } from "@/components/active-team-switcher";
import { AppLogo } from "@/components/brand/app-logo";
import { NativeBackButton } from "@/components/native-back-button";
import { ToolbarUtilityDropdown } from "@/components/toolbar-utility-dropdown";
import { useCapacitorNative } from "@/hooks/use-capacitor-native";
import { isEventDetailPath } from "@/hooks/use-navigation-direction";

type TeamOption = { id: string; name: string };

const NAV_LINKS = [
  { href: "/player", label: "我的行程" },
  { href: "/player/feedback", label: "我的回饋" },
  { href: "/player/notifications", label: "通知" },
] as const;

type Props = {
  teamName: string;
  teams: TeamOption[];
  currentTeamId: string;
  canAccessCoach: boolean;
};

/** 球員端頂部列：Web 漢堡選單；Capacitor 精簡為 logo + 標題 + 返回。 */
export function PlayerMainToolbar({ teamName, teams, currentTeamId, canAccessCoach }: Props) {
  const native = useCapacitorNative();
  const pathname = usePathname() ?? "";
  const showBack = native && isEventDetailPath(pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  const headerClass =
    "sticky top-0 z-40 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top,0px)] shadow-sm backdrop-blur-md dark:border-slate-700 dark:bg-slate-950/95";

  if (native) {
    return (
      <header className={headerClass}>
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2 px-4 py-2.5 sm:max-w-2xl">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {showBack ?
              <NativeBackButton />
            : (
              <AppLogo variant="badge" size={32} className="shrink-0" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{teamName}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">球員端</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ToolbarUtilityDropdown surface="player" currentView="player" canAccessCoach={canAccessCoach} />
            <UserButton />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={headerClass}>
      <div className="relative mx-auto max-w-lg sm:max-w-2xl">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 sm:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <AppLogo variant="badge" size={28} className="shrink-0" />
            {teams.length > 1 ?
              <>
                <ActiveTeamSwitcher teams={teams} currentTeamId={currentTeamId} variant="player" />
                <div className="hidden min-w-0 flex-col justify-center border-l border-slate-200 pl-2 dark:border-slate-700 sm:flex">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    球員端
                  </span>
                </div>
              </>
            : (
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">球員端</p>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{teamName}</p>
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <ToolbarUtilityDropdown surface="player" currentView="player" canAccessCoach={canAccessCoach} />
            <UserButton />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-expanded={menuOpen}
              aria-controls="player-mobile-menu"
              aria-label={menuOpen ? "關閉選單" : "開啟選單"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ?
                <span className="text-lg leading-none">✕</span>
              : (
                <span className="flex flex-col gap-1" aria-hidden>
                  <span className="block h-0.5 w-5 bg-slate-800 dark:bg-slate-200" />
                  <span className="block h-0.5 w-5 bg-slate-800 dark:bg-slate-200" />
                  <span className="block h-0.5 w-5 bg-slate-800 dark:bg-slate-200" />
                </span>
              )}
            </button>
          </div>
        </div>

        {menuOpen ?
          <>
            <button
              type="button"
              className="fixed inset-0 z-[45] bg-black/35"
              aria-label="關閉選單"
              onClick={closeMenu}
            />
            <div
              id="player-mobile-menu"
              className="absolute left-0 right-0 top-full z-50 border-b border-slate-200 bg-white px-4 py-4 shadow-lg dark:border-slate-700 dark:bg-slate-900"
            >
              <nav className="flex flex-col gap-1" aria-label="球員端主選單">
                {NAV_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2.5 text-base text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-950"
                    prefetch
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </>
        : null}
      </div>
    </header>
  );
}
