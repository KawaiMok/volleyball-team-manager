import { getDebugTeamMember } from "@/lib/debug-session";
import { generateMemberFitnessAssessment } from "@/lib/ai/generate-member-fitness-assessment";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { loadMemberFitnessAiContext } from "@/lib/fitness/member-ai-context";
import {
  memberFitnessAiReportSchema,
  type MemberFitnessAiReport,
} from "@/lib/member-fitness-ai-schema";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  /** 教練補充（註解：傷病、訓練目標、賽季階段等）。 */
  supplement: z.string().max(2000).optional().default(""),
});

/**
 * AI 產生隊員體能評價與訓練課表，覆寫 fitnessAiReport（註解：需 DEEPSEEK_API_KEY）。
 */
export async function POST(req: Request, ctx: Ctx) {
  const { id: targetMemberId } = await ctx.params;
  const actor = await getDebugTeamMember();
  if (!actor) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  if (!isCoachLike(actor)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const prisma = getPrisma();
  const context = await loadMemberFitnessAiContext(prisma, actor.teamId, targetMemberId);
  if (!context) {
    return NextResponse.json({ error: "找不到隊員" }, { status: 404 });
  }

  const limit = await checkAiRateLimit(actor.teamId);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "AI 呼叫過於頻繁", retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSec) } },
    );
  }

  let gen: Awaited<ReturnType<typeof generateMemberFitnessAssessment>>;
  try {
    gen = await generateMemberFitnessAssessment({
      jerseyNumber: context.jerseyNumber,
      position: context.position,
      ageYears: context.ageYears,
      heightCm: context.heightCm,
      weightKg: context.weightKg,
      supplement: body.supplement,
      sessionCount: context.sessionCount,
      recentSessions: context.recentSessions,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "MISSING_DEEPSEEK_API_KEY") {
      return NextResponse.json({ error: "伺服器未設定 DEEPSEEK_API_KEY" }, { status: 503 });
    }
    console.error(e);
    return NextResponse.json({ error: "AI 產生失敗" }, { status: 502 });
  }

  const report: MemberFitnessAiReport = {
    evaluation: gen.object.evaluation,
    trainingPlan: gen.object.trainingPlan,
    supplement: body.supplement.trim(),
    generatedAt: new Date().toISOString(),
    model: gen.modelId,
    usage: gen.usage,
  };

  const parsedReport = memberFitnessAiReportSchema.parse(report);

  await prisma.teamMember.update({
    where: { id: targetMemberId },
    data: { fitnessAiReport: parsedReport },
  });

  return NextResponse.json({ report: parsedReport });
}
