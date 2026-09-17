import Link from "next/link";
import type { ReactNode } from "react";

/** 儀表板／事件頁共用：淺藍 logo 入口磚（註解：href 直接導頁；onClick 開 popup）。 */
export function ServiceHubEntry({
  label,
  badge,
  icon,
  onClick,
  href,
  disabled,
}: {
  label: string;
  badge?: number;
  icon: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  const className =
    "group flex flex-col items-center gap-2 rounded-2xl border border-sky-100 bg-sky-50/80 p-4 transition hover:border-sky-200 hover:bg-sky-100/80 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 dark:border-sky-900/40 dark:bg-sky-950/25 dark:hover:bg-sky-950/40";

  const inner = (
    <>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-sky-100 group-hover:text-blue-700 dark:bg-zinc-900 dark:text-blue-400 dark:ring-sky-900/50">
        {icon}
        {badge != null && badge > 0 ?
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
            {badge > 99 ? "99+" : badge}
          </span>
        : null}
      </span>
      <span className="text-center text-xs font-semibold leading-snug text-zinc-800 dark:text-zinc-100">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-disabled={disabled}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {inner}
    </button>
  );
}

/** 入口網格容器 */
export function ServiceHubGrid({
  children,
  className = "grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
