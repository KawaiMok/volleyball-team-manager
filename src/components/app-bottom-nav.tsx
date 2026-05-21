"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { MascotTabIcon, mascotActionForTabLabel } from "@/components/brand/mascot-tab-icons";
import { useCapacitorNative } from "@/hooks/use-capacitor-native";
import { setNavDirection } from "@/hooks/use-navigation-direction";
import { hapticLight } from "@/lib/haptics";

type Surface = "coach" | "player";

type TabDef = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

type Props = {
  surface: Surface;
};

function playerTabs(): TabDef[] {
  return [
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
}

function coachTabs(): TabDef[] {
  return [
    { href: "/coach", label: "總覽", isActive: (p) => p === "/coach" },
    { href: "/coach/events", label: "事件", isActive: (p) => p.startsWith("/coach/events") },
    { href: "/coach/calendar", label: "行事曆", isActive: (p) => p.startsWith("/coach/calendar") },
    { href: "/coach/team", label: "隊伍", isActive: (p) => p.startsWith("/coach/team") },
    { href: "/coach/notifications", label: "通知", isActive: (p) => p.startsWith("/coach/notifications") },
  ];
}

/**
 * App 底部選單（註解：僅 Capacitor 原生殼；icon 為 mascot 動作版）。
 */
export function AppBottomNav({ surface }: Props) {
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

  const tabs = surface === "player" ? playerTabs() : coachTabs();
  const activeText = "text-[var(--app-text)]";
  const idleText = "text-[var(--app-text-muted)]";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--app-border)] bg-[var(--app-nav-bg)] backdrop-blur-md"
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
                <span className={`relative transition-transform ${active ? "scale-110" : "scale-100"}`}>
                  <MascotTabIcon
                    action={mascotActionForTabLabel(tab.label)}
                    size={26}
                    active={active}
                  />
                  {active ?
                    <span
                      className="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--brand-primary)]"
                      aria-hidden
                    />
                  : null}
                </span>
                <span>{tab.label}</span>
                {isNotif && unread > 0 ?
                  <span className="absolute right-1/4 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-accent)] px-1 text-[10px] font-bold text-white">
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
