"use client";

import { useEffect, useState } from "react";

/** 長頁捲動後顯示，回首頂（註解：錨點與 sticky header 搭配）。 */
export function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 380);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="fixed bottom-5 right-4 z-30 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-lg shadow-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-800 md:bottom-8 md:right-8"
      aria-label="回到頁面頂端"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span aria-hidden>↑</span>
    </button>
  );
}
