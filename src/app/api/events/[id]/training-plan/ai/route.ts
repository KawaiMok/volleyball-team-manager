import { getDebugTeamMember } from "@/lib/debug-session";
import { generateVolleyballTrainingPlan } from "@/lib/ai/generate-volleyball-training";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { getPrisma } from "@/lib/prisma";
import {
  assertTrainingEvent,
  canGenerateTrainingPlanAi,
} from "@/lib/training-plan-access";
import type { AiTrainingPlanOutput } from "@/lib/training-plan-schemas";
import type { TrainingPlanWriteInput } from "@/lib/training-plan-schemas";
import { upsertTrainingPlanReplaceBlocks } from "@/lib/training-plan-service";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const aiBodySchema = z.object({
  headcount: z.number().int().min(1).max(200),
  durationMinutes: z.number().int().min(15).max(600),
  skillFocus: z.string().max(500).optional().nullable(),
  constraints: z.string().max(2000).optional().nullable(),
  /** true：直接覆寫既有計畫；false：若已存在則 409（註解：預設 true 方便一鍵重產）。 */
  replace: z.boolean().optional().default(true),
});

function aiToWriteInput(o: AiTrainingPlanOutput): TrainingPlanWriteInput {
  let summary = o.summary;
  if (o.cooldown) summary += `\n\n冷身：${o.cooldown}`;
  if (o.homework) summary += `\n\n回家作業：${o.homework}`;
  return {
    title: o.titleSuggestion,
    summary,
    equipmentList: o.equipmentList,
    safetyNotes: o.safetyNotes,
    blocks: o.blocks.map((b, i) => ({
      order: i,
      name: b.name,
      minutes: b.minutes,
      goal: b.goal,
      setup: b.setup ?? null,
      steps: b.steps,
      coachCues: b.coachCues ?? null,
      groupingPlan: b.groupingPlan ?? null,
    })),
  };
}

/**
 * AI 產生訓練計畫並寫入 DB（註解：僅 Admin/Coach；需 DEEPSEEK_API_KEY）。
 */
export async function POST(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({ where: { id: eventId, teamId: member.teamId } });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  try {
    assertTrainingEvent(event);
  } catch {
    return NextResponse.json({ error: "僅訓練事件可使用 AI 產生計畫" }, { status: 400 });
  }
  if (!canGenerateTrainingPlanAi(member, event)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof aiBodySchema>;
  try {
    body = aiBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const limit = await checkAiRateLimit(member.teamId);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "AI 呼叫過於頻繁", retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSec) } },
    );
  }

  const existing = await prisma.trainingPlan.findUnique({ where: { eventId } });
  if (existing && !body.replace) {
    return NextResponse.json({ error: "已有訓練計畫，請傳 replace:true 覆寫或先刪除" }, { status: 409 });
  }

  let gen: Awaited<ReturnType<typeof generateVolleyballTrainingPlan>>;
  try {
    gen = await generateVolleyballTrainingPlan({
      headcount: body.headcount,
      durationMinutes: body.durationMinutes,
      skillFocus: body.skillFocus,
      constraints: body.constraints,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "MISSING_DEEPSEEK_API_KEY") {
      return NextResponse.json({ error: "伺服器未設定 DEEPSEEK_API_KEY" }, { status: 503 });
    }
    console.error(e);
    return NextResponse.json({ error: "AI 產生失敗" }, { status: 502 });
  }

  const write = aiToWriteInput(gen.object);
  const aiProvenance = {
    model: gen.modelId,
    generatedAt: new Date().toISOString(),
    input: {
      headcount: body.headcount,
      durationMinutes: body.durationMinutes,
      skillFocus: body.skillFocus,
      constraints: body.constraints,
    },
    usage: gen.usage,
  };

  await prisma.$transaction(async (tx) => {
    await upsertTrainingPlanReplaceBlocks(tx, {
      teamId: member.teamId,
      eventId,
      memberId: member.id,
      data: write,
      aiProvenance,
    });
  });

  const plan = await prisma.trainingPlan.findUnique({
    where: { eventId },
    include: { blocks: { orderBy: { order: "asc" } } },
  });
  return NextResponse.json({ plan, aiProvenance });
}
