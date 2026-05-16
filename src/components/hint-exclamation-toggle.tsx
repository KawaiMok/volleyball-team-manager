"use client";

import { useCallback, useEffect, useId, useState } from "react";

type Props = {
  children: React.ReactNode;
  /** 註解：給多個並列按鈕時區分 aria-controls。 */
  panelId?: string;
};

/**
 * 「!」按鈕收合說明（註解：父層請用 `flex flex-wrap items-center gap-2`，展開內容會 `basis-full` 換行滿寬）。
 */
export function HintExclamationToggle({ children, panelId: panelIdProp }: Props) {
  const reactId = useId().replace(/:/g, "");
  const panelId = panelIdProp ?? `hint-panel-${reactId}`;
  const btnId = `hint-btn-${reactId}`;
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, close]);

  return (
    <>
      <button
        id={btnId}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        title={open ? "收合說明" : "展開說明"}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-300 bg-zinc-100 text-sm font-bold leading-none text-zinc-600 shadow-sm hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        !
      </button>
      {open ?
        <div
          id={panelId}
          role="region"
          aria-labelledby={btnId}
          className="mt-2 w-full max-w-none basis-full rounded-lg border border-zinc-200 bg-zinc-50/90 px-3 py-2.5 text-sm leading-relaxed text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/80 dark:text-zinc-300"
        >
          {children}
        </div>
      : null}
    </>
  );
}
