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
  { href: "/coach", label: "總覽" },
  { href: "/coach/live-tactical", label: "即時戰術版" },
  { href: "/coach/events", label: "事件" },
  { href: "/coach/calendar", label: "行事曆" },
  { href: "/coach/team", label: "隊伍" },
  { href: "/coach/notifications", label: "通知" },
] as const;

type Props = {
  teamName: string;
  teams: TeamOption[];
  currentTeamId: string;
};

/** 教練端頂部列：Web 完整 nav；Capacitor 精簡為 logo + 標題 + 返回（註解：底部 Tab 負責主導覽）。 */
export function CoachMainToolbar({ teamName, teams, currentTeamId }: Props) {
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
    "sticky top-0 z-40 border-b border-zinc-200 bg-white/95 pt-[env(safe-area-inset-top,0px)] shadow-sm backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-zinc-950/90";

  if (native) {
    return (
      <header className={headerClass}>
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-4 py-2.5">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {showBack ?
              <NativeBackButton />
            : (
              <AppLogo variant="badge" size={32} className="shrink-0" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{teamName}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">教練端</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ToolbarUtilityDropdown surface="coach" currentView="coach" canAccessCoach={true} />
            <UserButton />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={headerClass}>
      <div className="relative mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-2 px-4 py-2.5 md:gap-4 md:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
            <AppLogo variant="badge" size={28} className="hidden shrink-0 sm:block" />
            {teams.length > 1 ?
              <ActiveTeamSwitcher teams={teams} currentTeamId={currentTeamId} variant="coach" />
            : (
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">教練端</p>
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50 sm:text-base">{teamName}</p>
              </div>
            )}
          </div>

          <nav
            className="hidden min-w-0 flex-nowrap items-center justify-end gap-3 text-sm lg:gap-4 md:flex"
            aria-label="教練端主選單"
          >
            {NAV_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
                prefetch
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/coach/events/new"
              className="shrink-0 rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              prefetch
            >
              新增事件
            </Link>
            <ToolbarUtilityDropdown surface="coach" currentView="coach" canAccessCoach={true} />
            <UserButton />
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 md:hidden">
            <ToolbarUtilityDropdown surface="coach" currentView="coach" canAccessCoach={true} />
            <UserButton />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
              aria-expanded={menuOpen}
              aria-controls="coach-mobile-menu"
              aria-label={menuOpen ? "關閉選單" : "開啟選單"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ?
                <span className="text-lg leading-none">✕</span>
              : (
                <span className="flex flex-col gap-1" aria-hidden>
                  <span className="block h-0.5 w-5 bg-zinc-800 dark:bg-zinc-200" />
                  <span className="block h-0.5 w-5 bg-zinc-800 dark:bg-zinc-200" />
                  <span className="block h-0.5 w-5 bg-zinc-800 dark:bg-zinc-200" />
                </span>
              )}
            </button>
          </div>
        </div>

        {menuOpen ?
          <>
            <button
              type="button"
              className="fixed inset-0 z-[45] bg-black/35 md:hidden"
              aria-label="關閉選單"
              onClick={closeMenu}
            />
            <div
              id="coach-mobile-menu"
              className="absolute left-0 right-0 top-full z-50 border-b border-zinc-200 bg-white px-4 py-4 shadow-lg md:hidden dark:border-zinc-800 dark:bg-zinc-900"
            >
              <nav className="mx-auto flex max-w-5xl flex-col gap-1" aria-label="教練端—行動版">
                {NAV_LINKS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-3 py-2.5 text-base text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-950"
                    prefetch
                    onClick={closeMenu}
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/coach/events/new"
                  className="mt-2 rounded-md bg-zinc-900 px-3 py-2.5 text-center text-base font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                  prefetch
                  onClick={closeMenu}
                >
                  新增事件
                </Link>
              </nav>
            </div>
          </>
        : null}
      </div>
    </header>
  );
}
