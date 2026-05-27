import {
  BRAND_STYLE_EVENT,
  BRAND_STYLE_STORAGE_KEY,
  type BrandStyleId,
  parseBrandStyleId,
} from "@/lib/brand-style";

export function getBrandStylePreference(): BrandStyleId {
  if (typeof window === "undefined") return "default";
  const v = localStorage.getItem(BRAND_STYLE_STORAGE_KEY);
  return parseBrandStyleId(v) ?? "default";
}

/** 套用至 `html[data-brand-style]`（註解：供 CSS 或除錯）。 */
export function applyDomBrandStyle(style: BrandStyleId) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.brandStyle = style;
}

export function setBrandStylePreference(style: BrandStyleId) {
  if (typeof window === "undefined") return;
  localStorage.setItem(BRAND_STYLE_STORAGE_KEY, style);
  applyDomBrandStyle(style);
  window.dispatchEvent(new CustomEvent(BRAND_STYLE_EVENT, { detail: style }));
}

export function subscribeBrandStylePreference(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (e: StorageEvent) => {
    if (e.key === BRAND_STYLE_STORAGE_KEY) cb();
  };
  const onCustom = () => cb();
  window.addEventListener("storage", onStorage);
  window.addEventListener(BRAND_STYLE_EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(BRAND_STYLE_EVENT, onCustom);
  };
}

/** 首屏 inline script（註解：與 applyDomBrandStyle 一致）。 */
export function brandStyleBootScript(storageKey: string) {
  return `(function(){try{var k=${JSON.stringify(storageKey)};var r=document.documentElement;var s=localStorage.getItem(k);if(s==="ciqing"||s==="default"){r.dataset.brandStyle=s;}else{r.dataset.brandStyle="default";}}catch(e){}})();`;
}
