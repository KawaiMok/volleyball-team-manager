/** localStorage key（註解：與 `layout.tsx` 內 `theme-boot` 內嵌腳本需一致）。 */
export const THEME_STORAGE_KEY = "vtm-theme";

export type ThemePreference = "system" | "light" | "dark" | "ciyou";

const THEME_EVENT = "vtm-theme-change";

export function getThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "system";
  const v = localStorage.getItem(THEME_STORAGE_KEY);
  if (v === "light" || v === "dark" || v === "system" || v === "ciyou") return v;
  return "system";
}

/** 是否為慈幼藍品牌主題 */
export function isCiyouTheme(pref: ThemePreference) {
  return pref === "ciyou";
}

/** 依偏好套用 `html` class 與 `color-scheme`（註解：慈幼藍為品牌淺色系，不用 dark class）。 */
export function applyDomTheme(pref: ThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");

  root.classList.remove("theme-ciyou");

  if (pref === "ciyou") {
    root.classList.remove("dark");
    root.classList.add("theme-ciyou");
    root.style.colorScheme = "light";
    return;
  }

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

/** 供首屏 inline script 使用（註解：須與 applyDomTheme 邏輯一致） */
export function themeBootScript(storageKey: string) {
  return `(function(){try{var k=${JSON.stringify(storageKey)};var r=document.documentElement;var s=localStorage.getItem(k);var m=window.matchMedia("(prefers-color-scheme: dark)");r.classList.remove("theme-ciyou");if(s==="ciyou"){r.classList.add("theme-ciyou");r.classList.remove("dark");r.style.colorScheme="light";}else{var d=s==="dark"||(s!=="light"&&(!s||s==="system")&&m.matches);r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}}catch(e){}})();`;
}
