"use client";

import Link from "next/link";

import { setNavDirection } from "@/hooks/use-navigation-direction";

type InsetGroupedListProps = {
  children: React.ReactNode;
  className?: string;
};

/** iOS 風格分組列表容器（註解：RN grouped list 手感） */
export function InsetGroupedList({ children, className = "" }: InsetGroupedListProps) {
  return <div className={`space-y-6 ${className}`.trim()}>{children}</div>;
}

type InsetGroupedSectionProps = {
  header?: string;
  footer?: string;
  children: React.ReactNode;
};

export function InsetGroupedSection({ header, footer, children }: InsetGroupedSectionProps) {
  return (
    <section className="space-y-1.5">
      {header ?
        <h2 className="px-4 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {header}
        </h2>
      : null}
      <ul className="divide-y divide-zinc-200/80 overflow-hidden rounded-2xl bg-[var(--surface-grouped)] shadow-sm ring-1 ring-black/5 dark:divide-zinc-700/80 dark:ring-white/10">
        {children}
      </ul>
      {footer ?
        <p className="px-4 text-xs text-zinc-500 dark:text-zinc-400">{footer}</p>
      : null}
    </section>
  );
}

type InsetGroupedRowProps = {
  href?: string;
  onClick?: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  chevron?: boolean;
  /** 未讀指示點 */
  unread?: boolean;
};

/** 單列 grouped row（註解：min 44px 觸控區、active 回饋） */
export function InsetGroupedRow({
  href,
  onClick,
  title,
  subtitle,
  badge,
  chevron = Boolean(href),
  unread,
}: InsetGroupedRowProps) {
  const inner = (
    <>
      {unread ?
        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--brand-primary)]" aria-hidden />
      : (
        <span className="mt-2 h-2 w-2 shrink-0" aria-hidden />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-start justify-between gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">{title}</span>
          {badge}
        </span>
        {subtitle ?
          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</span>
        : null}
      </span>
      {chevron ?
        <svg
          className="mt-1 h-4 w-4 shrink-0 text-zinc-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      : null}
    </>
  );

  const className =
    "flex w-full min-h-[44px] gap-3 px-4 py-3 text-left transition-colors active:bg-zinc-200/70 dark:active:bg-zinc-800/70";

  if (href) {
    return (
      <li>
        <Link
          href={href}
          prefetch
          className={className}
          onClick={() => setNavDirection("forward")}
        >
          {inner}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <button type="button" onClick={onClick} className={className}>
        {inner}
      </button>
    </li>
  );
}

/** 空狀態列 */
export function InsetGroupedEmpty({ children }: { children: React.ReactNode }) {
  return (
    <li className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">{children}</li>
  );
}
