import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  ids: z.array(z.string().min(1)).optional(),
  markAll: z.boolean().optional(),
});

/** 通知列表（註解：依建立時間倒序；`cursor` 為上一頁最後一筆 id）。 */
export async function GET(req: Request) {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "30", 10) || 30));
  const cursor = url.searchParams.get("cursor")?.trim() || undefined;

  const prisma = getPrisma();
  const rows = await prisma.userNotification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ?
      {
        cursor: { id: cursor },
        skip: 1,
      }
    : {}),
  });

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined;

  return NextResponse.json({
    items: items.map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      path: n.path,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
    nextCursor,
  });
}

/** 標記已讀（註解：`ids` 或 `markAll: true`）。 */
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
  const now = new Date();

  if (body.markAll) {
    await prisma.userNotification.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: now },
    });
    return NextResponse.json({ ok: true });
  }

  if (!body.ids?.length) {
    return NextResponse.json({ error: "請提供 ids 或 markAll" }, { status: 400 });
  }

  await prisma.userNotification.updateMany({
    where: { userId: user.id, id: { in: body.ids }, readAt: null },
    data: { readAt: now },
  });

  return NextResponse.json({ ok: true });
}
