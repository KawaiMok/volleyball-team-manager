import { PushPlatform } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const postSchema = z.object({
  token: z.string().min(1).max(4096),
  platform: z.enum(["ios", "android"]),
});

const deleteSchema = z
  .object({
    token: z.string().min(1).max(4096).optional(),
  })
  .optional();

function toPlatform(p: "ios" | "android"): PushPlatform {
  return p === "ios" ? PushPlatform.IOS : PushPlatform.ANDROID;
}

/**
 * 註冊或更新目前使用者的推播 token（註解：token 全域唯一；同一 token 改綁目前帳號）。
 */
export async function POST(req: Request) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  let body: z.infer<typeof postSchema>;
  try {
    body = postSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const platform = toPlatform(body.platform);

  await prisma.$transaction(async (tx) => {
    await tx.pushDevice.deleteMany({ where: { token: body.token } });
    await tx.pushDevice.create({
      data: {
        userId: user.id,
        token: body.token,
        platform,
      },
    });
  });

  return NextResponse.json({ ok: true });
}

/**
 * 註銷推播：有帶 `token` 則刪該裝置；未帶則刪除目前帳號下所有裝置（註解：登出全部／關推播）。
 */
export async function DELETE(req: Request) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  let parsed: z.infer<typeof deleteSchema>;
  try {
    const json = await req.json().catch(() => ({}));
    parsed = deleteSchema.parse(Object.keys(json).length ? json : undefined);
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const token = parsed?.token;

  if (token) {
    const row = await prisma.pushDevice.findFirst({
      where: { userId: user.id, token },
    });
    if (!row) {
      return NextResponse.json({ error: "找不到該裝置" }, { status: 404 });
    }
    await prisma.pushDevice.delete({ where: { id: row.id } });
  } else {
    await prisma.pushDevice.deleteMany({ where: { userId: user.id } });
  }

  return NextResponse.json({ ok: true });
}
