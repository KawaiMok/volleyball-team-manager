"use client";

import { useEffect, useState } from "react";

import { useCapacitorNative } from "@/hooks/use-capacitor-native";

type Props = {
  /** 捲動超過此像素才顯示（註解：預設 280）。 */
  threshold?: number;
};

/**
 * 長頁捲動後顯示，回到頂端（註解：全域使用；App 底部選單時抬高避免被遮住）。
 */
export function ScrollToTopButton({ threshold = 280 }: Props) {
  const native = useCapacitorNative();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  if (!visible) return null;

  const bottomClass = native ?
    "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
  : "bottom-5 md:bottom-8";

  return (
    <button
      type="button"
      className={`fixed right-4 z-[55] flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-lg text-zinc-800 shadow-lg hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:active:bg-zinc-800 md:right-8 ${bottomClass}`}
      aria-label="回到頁面頂端"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <span aria-hidden>↑</span>
    </button>
  );
}
