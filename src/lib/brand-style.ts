/** Logo／Avatar 風格 ID（註解：預設＝通用排球；慈青＝慈青體育會品牌）。 */
export type BrandStyleId = "default" | "ciqing";

export const BRAND_STYLE_COOKIE_NAME = "brand-style";

export const BRAND_STYLE_STORAGE_KEY = "vtm-brand-style";

export const BRAND_STYLE_EVENT = "vtm-brand-style-change";

/** 各風格顯示名稱 */
export const BRAND_STYLE_LABELS: Record<BrandStyleId, string> = {
  default: "預設",
  ciqing: "慈青",
};

/** 各風格簡述（註解：設定面板用）。 */
export const BRAND_STYLE_DESCRIPTIONS: Record<BrandStyleId, string> = {
  default: "通用排球徽章與吉祥物",
  ciqing: "慈青體育會專屬圖騰",
};

export function parseBrandStyleId(raw: string | null | undefined): BrandStyleId | null {
  if (raw === "default" || raw === "ciqing") return raw;
  if (raw === "DEFAULT") return "default";
  if (raw === "CIQING") return "ciqing";
  return null;
}

export function isBrandStyleId(v: string): v is BrandStyleId {
  return v === "default" || v === "ciqing";
}
