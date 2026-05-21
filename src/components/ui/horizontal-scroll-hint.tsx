"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** 右側浮動提示（註解：僅在可向右捲動且未到尾端時顯示）。 */
  hint?: string;
  /** 僅手機顯示文字提示（註解：桌機通常不需）。 */
  mobileHintOnly?: boolean;
};

/**
 * 橫向捲動容器 + 邊緣漸層／滑動提示（註解：讓使用者知道右側還有欄位）。
 */
export function HorizontalScrollHint({
  children,
  className = "",
  hint = "右滑查看更多",
  mobileHintOnly = true,
}: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth > clientWidth + 2;
    setCanScrollLeft(hasOverflow && scrollLeft > 4);
    setCanScrollRight(hasOverflow && scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });

    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, children]);

  const hintClass = mobileHintOnly ? "md:hidden" : "";

  return (
    <div className={`relative ${className}`}>
      <div ref={scrollerRef} className="w-full overflow-x-auto">
        {children}
      </div>

      {canScrollLeft ?
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white via-white/85 to-transparent dark:from-zinc-900 dark:via-zinc-900/85"
        />
      : null}

      {canScrollRight ?
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white via-white/85 to-transparent dark:from-zinc-900 dark:via-zinc-900/85 sm:w-14"
          />
          <p
            className={`pointer-events-none absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-zinc-900/80 px-2.5 py-1 text-[10px] font-medium text-white shadow-md backdrop-blur-sm dark:bg-zinc-100/90 dark:text-zinc-900 ${hintClass}`}
            role="note"
          >
            {hint}
            <span aria-hidden className="text-[11px] leading-none">
              →
            </span>
          </p>
        </>
      : null}
    </div>
  );
}
