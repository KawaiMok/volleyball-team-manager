"use client";

export type CoachEventSection = { id: string; label: string };

/** 跳至段落並觸發 hashchange（註解：確保摺疊區塊會展開）。 */
function jumpToSection(id: string) {
  const hash = `#${id}`;
  if (window.location.hash !== hash) {
    window.location.hash = id;
  } else {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

const pillClass =
  "inline-flex min-h-9 items-center justify-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-center text-xs font-medium text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-950";

type Props = {
  sections: CoachEventSection[];
};

/** 事件詳情：文字快捷鈕跳段（註解：僅顯示頁面上實際存在的區塊）。 */
export function CoachEventDetailSectionNav({ sections }: Props) {
  if (sections.length === 0) return null;

  return (
    <nav className="-mx-4 mb-6 px-4 pb-1 pt-1" aria-label="本頁段落快速跳轉">
      <div className="flex flex-wrap gap-2">
        {sections.map((s) => (
          <button key={s.id} type="button" onClick={() => jumpToSection(s.id)} className={pillClass}>
            {s.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
