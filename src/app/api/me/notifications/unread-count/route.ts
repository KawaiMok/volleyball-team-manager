import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";

/** 未讀通知數（註解：App 底部選單角標）。 */
export async function GET() {
  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const count = await getPrisma().userNotification.count({
    where: { userId: user.id, readAt: null },
  });

  return NextResponse.json({ count });
}
