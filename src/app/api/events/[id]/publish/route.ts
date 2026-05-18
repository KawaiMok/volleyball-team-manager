import { EventStatus } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { notifyTeamEventPublished } from "@/lib/push/notify-team";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

/** 發布事件（註解：球員始可見＋RSVP）。 */
export async function PATCH(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member || !isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  const prisma = getPrisma();
  const updated = await prisma.event.updateMany({
    where: { id, teamId: member.teamId },
    data: {
      status: EventStatus.PUBLISHED,
      publishedAt: new Date(),
      publishedByMemberId: member.id,
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }

  const event = await prisma.event.findFirst({ where: { id, teamId: member.teamId } });
  if (event) {
    notifyTeamEventPublished(event.teamId, event.id, event.title);
  }
  return NextResponse.json(event);
}
