import { BrandStyle } from "@/generated/prisma/client";
import { BRAND_STYLE_COOKIE_NAME } from "@/lib/brand-style";
import { brandStyleToPrisma } from "@/lib/brand-style-server";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  style: z.enum(["default", "ciqing"]),
});

/** 更新使用者 Logo／Avatar 風格並寫入 cookie（註解：登入後跨裝置同步）。 */
export async function PATCH(req: Request) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  let body: z.infer<typeof patchSchema>;
  try {
    body = patchSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { brandStyle: brandStyleToPrisma(body.style) },
    select: { brandStyle: true },
  });

  const res = NextResponse.json({
    style: updated.brandStyle === BrandStyle.CIQING ? "ciqing" : "default",
  });

  res.cookies.set(BRAND_STYLE_COOKIE_NAME, body.style, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  return res;
}

/** 讀取目前風格（註解：client 初始化用）。 */
export async function GET() {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  return NextResponse.json({
    style: user.brandStyle === BrandStyle.CIQING ? "ciqing" : "default",
  });
}
