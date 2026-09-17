import Link from "next/link";
import type { ReactNode } from "react";

/** 事件類型（註解：與 Prisma EventType 字串一致，避免 client 打包 prisma）。 */
export type DashboardEventTypeKey = "TRAINING" | "MATCH" | "FITNESS_TEST" | "OTHER";

function eventTypeShort(t: DashboardEventTypeKey): string {
  switch (t) {
    case "TRAINING":
      return "訓練";
    case "MATCH":
      return "賽";
    case "FITNESS_TEST":
      return "體能";
    default:
      return "其他";
  }
}

/** 區塊標題列（註解：淺藍連結色）。 */
export function DashboardSectionHeader({
  title,
  hint,
  moreHref,
  moreLabel = "更多",
}: {
  title: string;
  hint?: ReactNode;
  moreHref?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h2>
        {hint}
      </div>
      {moreHref ?
        <Link
          href={moreHref}
          className="shrink-0 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {moreLabel} →
        </Link>
      : null}
    </div>
  );
}

/** 統計小卡（註解：sky 淺藍底）。 */
export function DashboardStatTile({
  label,
  value,
  href,
  hrefLabel,
  emphasize = false,
}: {
  label: string;
  value: ReactNode;
  href?: string;
  hrefLabel?: string;
  emphasize?: boolean;
}) {
  const border =
    emphasize ?
      "border-amber-200 dark:border-amber-800"
    : "border-sky-100 dark:border-sky-900/50";

  return (
    <div
      className={`flex min-h-[7rem] flex-col justify-between rounded-xl border bg-sky-50/90 p-4 dark:bg-sky-950/30 ${border}`}
    >
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {href && hrefLabel ?
        <Link href={href} className="mt-2 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400">
          {hrefLabel}
        </Link>
      : <span className="mt-2 block h-4" />}
    </div>
  );
}

const EVENT_TYPE_BADGE: Record<DashboardEventTypeKey, string> = {
  TRAINING: "bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200",
  MATCH: "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200",
  FITNESS_TEST: "bg-teal-100 text-teal-800 dark:bg-teal-950/50 dark:text-teal-200",
  OTHER: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

/** 事件列表列（註解：Sheet 內用，非 logo 磚）。 */
export function DashboardEventListItem({
  href,
  title,
  type,
  meta,
  badge,
}: {
  href: string;
  title: string;
  type: DashboardEventTypeKey;
  meta: string;
  badge?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 px-3 py-3 transition hover:bg-sky-50/60 dark:hover:bg-sky-950/20"
    >
      <span
        className={`mt-0.5 shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${EVENT_TYPE_BADGE[type] ?? EVENT_TYPE_BADGE.OTHER}`}
      >
        {eventTypeShort(type)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-50">{title}</p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{meta}</p>
        {badge ?
          <div className="mt-1.5">{badge}</div>
        : null}
      </div>
      <span className="shrink-0 text-zinc-400" aria-hidden>
        ›
      </span>
    </Link>
  );
}

export function memberInitial(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.charAt(0);
}
