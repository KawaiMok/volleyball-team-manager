import { buildTeamFitnessTrainingAdvicePromptPreview } from "@/lib/ai/generate-team-fitness-training-advice";
import { loadTeamFitnessAiContext, pickAnalysisBatch } from "@/lib/fitness/team-ai-context";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  supplement: z.string().max(2000).optional().default(""),
});

/** 預覽團體體能訓練建議 prompt（註解：不呼叫 AI）。 */
export async function POST(req: Request) {
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

  const context = await loadTeamFitnessAiContext(getPrisma(), actor.teamId);
  if (!context.latestAnalysisBatchId) {
    return NextResponse.json({ error: "請先執行「體能分析」" }, { status: 400 });
  }

  const analysisBatch = pickAnalysisBatch(context.players, context.latestAnalysisBatchId);
  const preview = buildTeamFitnessTrainingAdvicePromptPreview({
    players: context.players,
    analysisBatch,
    supplement: body.supplement,
  });

  return NextResponse.json({
    preview,
    analysisBatchId: context.latestAnalysisBatchId,
    analysisCount: analysisBatch.length,
  });
}
