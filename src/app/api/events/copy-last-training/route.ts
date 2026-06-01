import { EventType } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { DuplicateEventError, duplicateEvent } from "@/lib/duplicate-event";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  /** 相對最近一場訓練的平移天數（註解：預設 +7）。 */
  shiftDays: z.number().int().min(-365).max(365).optional(),
});

/** 複製最近一場訓練為新草稿（註解：「複製上週訓練」快捷）。 */
export async function POST(req: Request) {
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  if (!isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json().catch(() => ({})));
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const shiftDays = body.shiftDays ?? 7;
  const prisma = getPrisma();

  const lastTraining = await prisma.event.findFirst({
    where: { teamId: member.teamId, type: EventType.TRAINING },
    orderBy: { startsAt: "desc" },
    select: { id: true, title: true, startsAt: true },
  });

  if (!lastTraining) {
    return NextResponse.json({ error: "尚無訓練事件可複製，請先建立一場訓練" }, { status: 404 });
  }

  try {
    const created = await prisma.$transaction((tx) =>
      duplicateEvent(tx, {
        sourceEventId: lastTraining.id,
        teamId: member.teamId,
        actorMemberId: member.id,
        shiftDays,
      }),
    );
    return NextResponse.json(
      { ...created, sourceEventId: lastTraining.id, sourceTitle: lastTraining.title },
      { status: 201 },
    );
  } catch (e) {
    if (e instanceof DuplicateEventError) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }
    throw e;
  }
}
