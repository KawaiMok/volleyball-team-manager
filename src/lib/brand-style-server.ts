import { cache } from "react";

import { BrandStyle } from "@/generated/prisma/client";
import type { BrandStyleId } from "@/lib/brand-style";

/** Prisma enum → 前端 ID */
export function brandStyleFromPrisma(v: BrandStyle | null | undefined): BrandStyleId {
  return v === BrandStyle.CIQING ? "ciqing" : "default";
}

/** 前端 ID → Prisma enum */
export function brandStyleToPrisma(v: BrandStyleId): BrandStyle {
  return v === "ciqing" ? BrandStyle.CIQING : BrandStyle.DEFAULT;
}

/** 目前請求的 Logo 風格（註解：固定慈青；切換 UI 已隱藏）。 */
export const getBrandStyleForRequest = cache(async (): Promise<BrandStyleId> => {
  return "ciqing";
});
