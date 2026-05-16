/** 與 Prisma EventStatus 字串一致（註解：client 組件可不依賴 `@/generated/prisma` 打包）。 */
export type EventStatusKey = "DRAFT" | "PUBLISHED" | "CANCELLED";

const EVENT_DOT: Record<EventStatusKey, string> = {
  DRAFT: "bg-amber-500",
  PUBLISHED: "bg-emerald-500",
  CANCELLED: "bg-zinc-400 dark:bg-zinc-500",
};

function eventStatusText(s: EventStatusKey) {
  switch (s) {
    case "DRAFT":
      return "草稿";
    case "PUBLISHED":
      return "已發布";
    case "CANCELLED":
      return "已取消";
    default:
      return String(s);
  }
}

/**
 * 事件狀態：僅色點（註解：語意見圖例；`title`／`aria-label` 供懸停與螢幕報讀）。
 */
export function EventStatusIndicator({ status }: { status: EventStatusKey }) {
  const label = eventStatusText(status);
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full align-middle ${EVENT_DOT[status]}`}
      role="img"
      aria-label={label}
      title={label}
    />
  );
}

/**
 * 事件狀態圖例（註解：列在表格外／標題旁，解釋圓點顏色）。
 */
export function EventStatusLegend({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden />
        草稿
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        已發布
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" aria-hidden />
        已取消
      </span>
    </p>
  );
}

/**
 * 隊籍狀態（在籍／停用）：僅色點（註解：語意見圖例）。
 */
export function TeamMemberStatusIndicator({ status }: { status: string }) {
  const active = status === "ACTIVE";
  const label = active ? "在籍" : "停用";
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full align-middle ${active ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-500"}`}
      role="img"
      aria-label={label}
      title={label}
    />
  );
}

/**
 * 隊籍狀態圖例。
 */
export function TeamMemberStatusLegend({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400 ${className}`}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
        在籍
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full bg-zinc-400 dark:bg-zinc-500" aria-hidden />
        停用
      </span>
    </p>
  );
}
