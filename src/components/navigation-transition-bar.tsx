"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * 頁面轉換時頂部細條動畫（註解：補足 Link／router 轉場，不取代 `loading.tsx` RSC 內容）。
 */
export function NavigationTransitionBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const [visible, setVisible] = useState(false);
  const skipFirst = useRef(true);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    setVisible(true);
    const hide = window.setTimeout(() => setVisible(false), 450);
    return () => clearTimeout(hide);
  }, [pathname, search]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[200] h-[3px] overflow-hidden bg-zinc-200/60 dark:bg-zinc-700/40"
      aria-hidden
    >
      <div className="navigation-bar-indeterminate h-full w-1/3 rounded-full bg-zinc-800 shadow-sm dark:bg-zinc-200" />
    </div>
  );
}
