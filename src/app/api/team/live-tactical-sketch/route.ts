import { courtSketchSchema } from "@/lib/court-sketch-schema";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";

/** 更新隊伍即時戰術版 JSON（註解：僅教練／管理員；與事件企位同 schema）。 */
export async function PATCH(req: Request) {
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
    return NextResponse.json({ error: "戰術版資料格式不正確" }, { status: 400 });
  }

  const prisma = getPrisma();
  const updated = await prisma.team.update({
    where: { id: member.teamId },
    data: { liveTacticalSketch: sketchParsed },
    select: { id: true, liveTacticalSketch: true, updatedAt: true },
  });

  return NextResponse.json(updated);
}
