import { EventStatus, FatigueLevel, PainLevel } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  rpe: z.number().int().min(1).max(10),
  fatigue: z.nativeEnum(FatigueLevel),
  painLevel: z.nativeEnum(PainLevel),
  painArea: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

/** 球員提交訓練回饋（註解：事件結束後才可送；24 小時內可更新）。 */
export async function POST(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
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
  if (event.status !== EventStatus.PUBLISHED) {
    return NextResponse.json({ error: "事件尚未發布" }, { status: 403 });
  }

  const participant = await prisma.eventParticipant.findUnique({
    where: { eventId_memberId: { eventId, memberId: member.id } },
  });
  if (!participant) {
    return NextResponse.json({ error: "你不是此事件的參與者" }, { status: 403 });
  }

  const now = new Date();
  if (now < event.endsAt) {
    return NextResponse.json({ error: "事件尚未結束，暫不可填寫回饋" }, { status: 400 });
  }

  const existing = await prisma.feedback.findUnique({
    where: { eventId_memberId: { eventId, memberId: member.id } },
  });
  if (existing) {
    const deadline = new Date(existing.submittedAt.getTime() + 24 * 60 * 60 * 1000);
    if (now > deadline) {
      return NextResponse.json({ error: "超過可編輯時間（24 小時）" }, { status: 400 });
    }
  }

  const row = await prisma.feedback.upsert({
    where: { eventId_memberId: { eventId, memberId: member.id } },
    create: {
      eventId,
      memberId: member.id,
      rpe: body.rpe,
      fatigue: body.fatigue,
      painLevel: body.painLevel,
      painArea: body.painArea ?? undefined,
      note: body.note ?? undefined,
    },
    update: {
      rpe: body.rpe,
      fatigue: body.fatigue,
      painLevel: body.painLevel,
      painArea: body.painArea ?? undefined,
      note: body.note ?? undefined,
    },
  });

  return NextResponse.json(row, { status: existing ? 200 : 201 });
}
