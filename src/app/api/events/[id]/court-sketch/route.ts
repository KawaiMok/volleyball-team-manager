import { EventStatus } from "@/generated/prisma/client";
import { courtSketchSchema } from "@/lib/court-sketch-schema";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

/** 更新事件場上企位 JSON（註解：僅教練／管理員；已取消事件不可改）。 */
export async function PATCH(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  if (!isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  let sketchParsed;
  try {
    sketchParsed = courtSketchSchema.parse(body);
  } catch {
    return NextResponse.json({ error: "企位資料格式不正確" }, { status: 400 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
    select: { id: true, status: true },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  if (event.status === EventStatus.CANCELLED) {
    return NextResponse.json({ error: "已取消的事件無法編輯企位圖" }, { status: 400 });
  }

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { courtSketch: sketchParsed },
    select: { id: true, courtSketch: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}
