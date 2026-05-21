/** 導航方向 sessionStorage key（註解：Link 點擊 / router.back 前寫入，PageTransition 讀取）。 */
export const NAV_DIRECTION_KEY = "vtm-nav-direction";

export type NavDirection = "forward" | "back";

/** 寫入導航方向 */
export function setNavDirection(direction: NavDirection) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(NAV_DIRECTION_KEY, direction);
}

/** 讀取並清除方向；預設 forward */
export function consumeNavDirection(): NavDirection {
  if (typeof window === "undefined") return "forward";
  const d = sessionStorage.getItem(NAV_DIRECTION_KEY) as NavDirection | null;
  sessionStorage.removeItem(NAV_DIRECTION_KEY);
  return d === "back" ? "back" : "forward";
}

/** 路徑深度（註解：用於 stack push / pop 判斷） */
export function getPathDepth(pathname: string) {
  return pathname.split("/").filter(Boolean).length;
}

/** 主 Tab 路由（註解：同層 Tab 切換用 fade） */
const COACH_TABS = ["/coach", "/coach/events", "/coach/calendar", "/coach/notifications"];
const PLAYER_TABS = ["/player", "/player/feedback", "/player/notifications"];

export function isTabSwitch(prev: string, curr: string) {
  const tabs = curr.startsWith("/coach") ? COACH_TABS : PLAYER_TABS;
  return tabs.includes(prev) && tabs.includes(curr) && prev !== curr;
}

export function getSurface(pathname: string) {
  if (pathname.startsWith("/coach")) return "coach";
  if (pathname.startsWith("/player")) return "player";
  return null;
}

export type TransitionKind = "fade" | "stack-push" | "stack-pop" | "crossfade";

/** 依前後路徑與方向決定轉場類型 */
export function resolveTransitionKind(prev: string, curr: string, direction: NavDirection): TransitionKind {
  const prevSurface = getSurface(prev);
  const currSurface = getSurface(curr);
  if (prevSurface && currSurface && prevSurface !== currSurface) return "crossfade";

  const prevDepth = getPathDepth(prev);
  const currDepth = getPathDepth(curr);

  if (direction === "back" || currDepth < prevDepth) return "stack-pop";
  if (currDepth > prevDepth || /\/events\/[^/]+$/.test(curr)) return "stack-push";
  if (isTabSwitch(prev, curr)) return "fade";
  return "fade";
}

/** 詳情頁需顯示返回鍵（註解：Capacitor 原生殼用） */
export function isEventDetailPath(pathname: string) {
  return /\/events\/[^/]+$/.test(pathname);
}
