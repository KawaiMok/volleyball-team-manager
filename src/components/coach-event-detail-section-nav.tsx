"use client";

export type CoachEventSection = { id: string; label: string };

type Props = {
  sections: CoachEventSection[];
};

/** 膠囊共用樣式（註解：與舊版視覺一致，hover 補上 dark）。 */
const pillClass =
  "flex w-full min-h-9 items-center justify-center rounded-full border border-zinc-200 bg-white px-2 py-1.5 text-center text-xs font-medium text-zinc-700 shadow-sm hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-950 sm:w-auto sm:min-w-0 sm:shrink-0 sm:justify-center sm:px-3";

/**
 * 事件詳情快捷跳段（註解：點擊錨點會自動展開對應摺疊卡片）。
 */
export function CoachEventDetailSectionNav({ sections }: Props) {
  return (
    <nav className="-mx-4 mb-6 px-4 pb-1 pt-1" aria-label="本頁段落快速跳轉">
      {/** 註解：預設（窄螢幕）兩欄 grid；sm 以上改 flex-wrap。 */}
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2">
        {sections.map((s) => (
          <a key={s.id} href={`#${s.id}`} className={pillClass}>
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
