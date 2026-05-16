"use client";

export type CoachEventSection = { id: string; label: string };

type Props = {
  sections: CoachEventSection[];
};

/**
 * 事件詳情快捷跳段（註解：橫向捲動標籤，避免長頁漏看區塊）。
 * 對應各 `<section id={...}>` 須加 `scroll-mt-28` 以免被 sticky 頂欄遮住。
 */
export function CoachEventDetailSectionNav({ sections }: Props) {
  return (
    <nav className="-mx-4 mb-6 overflow-x-auto px-4 pb-1 pt-1 [scrollbar-width:thin]" aria-label="本頁段落快速跳轉">
      <div className="flex w-max max-w-none gap-2 pr-2">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-sm hover:border-zinc-400 hover:bg-zinc-50 dark:bg-zinc-950"
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
