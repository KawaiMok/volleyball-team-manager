"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { AppLogo } from "@/components/brand/app-logo";

type NavItem = { href: string; label: string; exact?: boolean };

const platformNav: NavItem[] = [
  { href: "/platform", label: "總覽", exact: true },
  { href: "/platform/organizations", label: "組織管理" },
];

type Props = {
  variant: "platform" | "org";
  orgSlug?: string;
  orgName?: string;
};

/** 平台／組織後台側邊欄（註解：桌面優先管理介面）。 */
export function AdminSidebar({ variant, orgSlug, orgName }: Props) {
  const pathname = usePathname();

  const orgNav: NavItem[] =
    orgSlug ?
      [
        { href: `/org/${orgSlug}`, label: "儀表板", exact: true },
        { href: `/org/${orgSlug}/teams/new`, label: "建立球隊" },
        { href: `/org/${orgSlug}/members`, label: "組織成員" },
      ]
    : [];

  const items = variant === "platform" ? platformNav : orgNav;

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <AppLogo variant="badge" size={28} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {variant === "platform" ? "平台管理" : (orgName ?? "組織管理")}
          </p>
          <p className="truncate text-xs text-zinc-500">排球隊管理</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => {
          const active =
            item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ?
                  "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
          ← 回首頁
        </Link>
      </div>
    </aside>
  );
}
