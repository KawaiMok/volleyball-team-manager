import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  updates: z
    .array(
      z.object({
        memberId: z.string(),
        checkedIn: z.boolean(),
      }),
    )
    .min(1),
});

/** 教練點名：批次更新 checkedIn（註解：寫入 checkedInByMemberId）。 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member || !isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }

  const now = new Date();
  await prisma.$transaction(
    body.updates.map((u) =>
      prisma.attendance.update({
        where: { eventId_memberId: { eventId, memberId: u.memberId } },
        data: {
          checkedIn: u.checkedIn,
          checkedInAt: u.checkedIn ? now : null,
          checkedInByMemberId: u.checkedIn ? member.id : null,
        },
      }),
    ),
  );

  const rows = await prisma.attendance.findMany({ where: { eventId } });
  return NextResponse.json(rows);
}
