"use client";

import { useEffect, useState } from "react";

/** 是否為窄螢幕（註解：對齊 Tailwind md，手機 Web 頂欄選單改 BottomSheet）。 */
export function useMobileViewport(breakpointPx = 768): boolean {
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const sync = () => setMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpointPx]);

  return mobile;
}
