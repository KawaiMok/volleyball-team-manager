import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string; assetId: string }> };

/** 刪除事件連結（註解：僅教練／管理員）。 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id: eventId, assetId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  if (!isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  const prisma = getPrisma();
  const asset = await prisma.fileAsset.findFirst({
    where: {
      id: assetId,
      eventId,
      teamId: member.teamId,
    },
  });
  if (!asset) {
    return NextResponse.json({ error: "找不到連結" }, { status: 404 });
  }

  await prisma.fileAsset.delete({ where: { id: assetId } });
  return NextResponse.json({ ok: true });
}
