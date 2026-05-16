/** localStorage key（註解：與 `layout.tsx` 內 `theme-boot` 內嵌腳本需一致）。 */
export const THEME_STORAGE_KEY = "vtm-theme";

export type ThemePreference = "system" | "light" | "dark";

const THEME_EVENT = "vtm-theme-change";

export function getThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system") return v;
  return "system";
}

/** 依偏好套用 `html.dark` 與 `color-scheme`（註解：供首屏腳本與 UI 共用）。 */
export function applyDomTheme(pref: ThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const dark = pref === "dark" || (pref === "system" && mq.matches);
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function setThemePreference(pref: ThemePreference) {
  if (typeof window === "undefined") return;
  localStorage.setItem(THEME_STORAGE_KEY, pref);
  applyDomTheme(pref);
  window.dispatchEvent(new CustomEvent(THEME_EVENT));
}

export function subscribeThemePreference(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) cb();
  };
  const onCustom = () => cb();
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_EVENT, onCustom);
  };
}
