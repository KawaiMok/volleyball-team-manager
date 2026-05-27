import { cookies } from "next/headers";
import { cache } from "react";

import { BrandStyle } from "@/generated/prisma/client";
import {
  BRAND_STYLE_COOKIE_NAME,
  type BrandStyleId,
  parseBrandStyleId,
} from "@/lib/brand-style";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";

/** Prisma enum → 前端 ID */
export function brandStyleFromPrisma(v: BrandStyle | null | undefined): BrandStyleId {
  return v === BrandStyle.CIQING ? "ciqing" : "default";
}

/** 前端 ID → Prisma enum */
export function brandStyleToPrisma(v: BrandStyleId): BrandStyle {
  return v === "ciqing" ? BrandStyle.CIQING : BrandStyle.DEFAULT;
}

/** 目前請求的 Logo／Avatar 風格（註解：cookie 優先，其次 User.brandStyle）。 */
export const getBrandStyleForRequest = cache(async (): Promise<BrandStyleId> => {
  const c = await cookies();
  const fromCookie = parseBrandStyleId(c.get(BRAND_STYLE_COOKIE_NAME)?.value);
  if (fromCookie) return fromCookie;

  const user = await getOrSyncPrismaUserFromClerk();
  if (user) return brandStyleFromPrisma(user.brandStyle);

  return "default";
});
