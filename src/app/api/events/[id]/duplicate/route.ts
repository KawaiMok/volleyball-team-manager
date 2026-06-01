import { getDebugTeamMember } from "@/lib/debug-session";
import { DuplicateEventError, duplicateEvent } from "@/lib/duplicate-event";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  /** 時間平移天數（註解：預設 +7 天，對應「下週同一時段」）。 */
  shiftDays: z.number().int().min(-365).max(365).optional(),
  copyTrainingPlan: z.boolean().optional(),
  copyCourtSketch: z.boolean().optional(),
  copyMediaLinks: z.boolean().optional(),
});

/** 複製單一事件為新草稿（註解：教練／管理員）。 */
export async function POST(req: Request, ctx: Ctx) {
  const { id: sourceEventId } = await ctx.params;
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

  try {
    const prisma = getPrisma();
    const created = await prisma.$transaction((tx) =>
      duplicateEvent(tx, {
        sourceEventId,
        teamId: member.teamId,
        actorMemberId: member.id,
        shiftDays,
        copyTrainingPlan: body.copyTrainingPlan,
        copyCourtSketch: body.copyCourtSketch,
        copyMediaLinks: body.copyMediaLinks,
      }),
    );
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    if (e instanceof DuplicateEventError) {
      const status = e.code === "NOT_FOUND" ? 404 : 400;
      return NextResponse.json({ error: e.message }, { status });
    }
    throw e;
  }
}
