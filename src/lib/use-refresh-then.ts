"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useTransition } from "react";

/**
 * 在 `router.refresh()` 完成後執行回呼（註解：搭配 `useTransition`，避免 toast 早於 RSC 更新）。
 */
export function useRefreshThen() {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const afterRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isRefreshing && afterRef.current) {
      const fn = afterRef.current;
      afterRef.current = null;
      fn();
    }
  }, [isRefreshing]);

  const refreshThen = useCallback(
    (after?: () => void) => {
      afterRef.current = after ?? null;
      startTransition(() => {
        router.refresh();
      });
    },
    [router, startTransition],
  );

  return { refreshThen, isRefreshing };
}
