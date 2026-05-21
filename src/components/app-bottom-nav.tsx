"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useCapacitorNative } from "@/hooks/use-capacitor-native";
import { setNavDirection } from "@/hooks/use-navigation-direction";
import { hapticLight } from "@/lib/haptics";

type Surface = "coach" | "player";

type TabDef = {
  href: string;
  label: string;
  /** 是否為目前分頁（註解：支援子路徑前綴比對）。 */
  isActive: (pathname: string) => boolean;
};

type Props = {
  surface: Surface;
  /** 球員端是否顯示「教練」分頁（註解：教練兼球員／管理員）。 */
  canAccessCoach: boolean;
  /** 教練端是否顯示「球員」分頁（註解：教練端一律可預覽球員畫面）。 */
  canAccessPlayer: boolean;
};

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1V9.5z" />
    </svg>
  );
}

function IconList({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconSwitch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function playerTabs(canAccessCoach: boolean): TabDef[] {
  const tabs: TabDef[] = [
    {
      href: "/player",
      label: "行程",
      isActive: (p) => p === "/player" || /^\/player\/events\/[^/]+$/.test(p),
    },
    {
      href: "/player/feedback",
      label: "回饋",
      isActive: (p) => p.startsWith("/player/feedback"),
    },
    {
      href: "/player/notifications",
      label: "通知",
      isActive: (p) => p.startsWith("/player/notifications"),
    },
  ];
  if (canAccessCoach) {
    tabs.push({
      href: "/coach",
      label: "教練",
      isActive: (p) => p.startsWith("/coach"),
    });
  }
  return tabs;
}

function coachTabs(canAccessPlayer: boolean): TabDef[] {
  const tabs: TabDef[] = [
    {
      href: "/coach",
      label: "總覽",
      isActive: (p) => p === "/coach",
    },
    {
      href: "/coach/events",
      label: "事件",
      isActive: (p) => p.startsWith("/coach/events"),
    },
    {
      href: "/coach/calendar",
      label: "行事曆",
      isActive: (p) => p.startsWith("/coach/calendar"),
    },
    {
      href: "/coach/notifications",
      label: "通知",
      isActive: (p) => p.startsWith("/coach/notifications"),
    },
  ];
  if (canAccessPlayer) {
    tabs.push({
      href: "/player",
      label: "球員",
      isActive: (p) => p.startsWith("/player"),
    });
  }
  return tabs;
}

function tabIcon(tab: TabDef, surface: Surface) {
  const cls = "h-6 w-6";
  if (tab.label === "通知") return <IconBell className={cls} />;
  if (tab.label === "行程" || tab.label === "總覽") return <IconHome className={cls} />;
  if (tab.label === "回饋") return <IconList className={cls} />;
  if (tab.label === "事件") return <IconList className={cls} />;
  if (tab.label === "行事曆") return <IconCalendar className={cls} />;
  if (tab.label === "教練" || tab.label === "球員") return <IconSwitch className={cls} />;
  if (tab.label === "隊伍") return <IconUsers className={cls} />;
  return <IconHome className={cls} />;
}

/**
 * App 底部選單（註解：僅 Capacitor 原生殼顯示；單手切換主要分頁與教練／球員端）。
 */
export function AppBottomNav({ surface, canAccessCoach, canAccessPlayer }: Props) {
  const native = useCapacitorNative();
  const pathname = usePathname() ?? "";
  const [unread, setUnread] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/me/notifications/unread-count", { credentials: "include" });
      const data = (await res.json()) as { count?: number };
      if (res.ok) setUnread(data.count ?? 0);
    } catch {
      /** 註解：未登入或網路錯誤時忽略。 */
    }
  }, []);

  useEffect(() => {
    if (!native) return;
    void refreshUnread();
    const onUpdate = () => void refreshUnread();
    window.addEventListener("notifications-updated", onUpdate);
    return () => window.removeEventListener("notifications-updated", onUpdate);
  }, [native, refreshUnread, pathname]);

  if (!native) return null;

  const tabs = surface === "player" ? playerTabs(canAccessCoach) : coachTabs(canAccessPlayer);

  const bar =
    surface === "coach" ?
      "border-zinc-200 bg-white/95 dark:border-zinc-800 dark:bg-zinc-950/95"
    : "border-slate-200 bg-white/95 dark:border-slate-700 dark:bg-slate-950/95";

  const activeText =
    surface === "coach" ? "text-zinc-900 dark:text-zinc-50" : "text-slate-900 dark:text-slate-50";
  const idleText =
    surface === "coach" ? "text-zinc-500 dark:text-zinc-400" : "text-slate-500 dark:text-slate-400";

  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-md ${bar}`}
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      aria-label="App 主選單"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1 sm:max-w-2xl md:max-w-5xl">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname);
          const isNotif = tab.href.includes("/notifications");
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                prefetch
                className={`relative flex flex-col items-center gap-0.5 px-1 py-1.5 text-[10px] font-medium sm:text-xs ${
                  active ? activeText : idleText
                }`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  if (!active) {
                    setNavDirection("forward");
                    void hapticLight();
                  }
                }}
              >
                <span className="relative">
                  {tabIcon(tab, surface)}
                  {active ?
                    <span
                      className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--brand-primary)]"
                      aria-hidden
                    />
                  : null}
                </span>
                <span>{tab.label}</span>
                {isNotif && unread > 0 ?
                  <span className="absolute right-1/4 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 為底部選單預留空間（註解：僅原生殼）。 */
export function NativeAppContentPad({ children }: { children: React.ReactNode }) {
  const native = useCapacitorNative();
  return (
    <div className={native ? "pb-[calc(4.5rem+env(safe-area-inset-bottom))]" : undefined}>{children}</div>
  );
}
