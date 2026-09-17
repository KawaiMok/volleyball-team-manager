import { generateTeamFitnessTrainingAdvice } from "@/lib/ai/generate-team-fitness-training-advice";
import { replacePlayerKeysWithDisplayNames } from "@/lib/ai/fitness-player-key-resolve";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { loadTeamFitnessAiContext, pickAnalysisBatch } from "@/lib/fitness/team-ai-context";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { teamFitnessTrainingAdviceSchema } from "@/lib/team-fitness-ai-schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  supplement: z.string().max(2000).optional().default(""),
});

/** 團體體能訓練建議：寫入 Team.fitnessTeamTrainingAdvice（註解：每次覆寫）。 */
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

  const prisma = getPrisma();
  const context = await loadTeamFitnessAiContext(prisma, actor.teamId);
  if (!context.latestAnalysisBatchId) {
    return NextResponse.json({ error: "請先執行「體能分析」" }, { status: 400 });
  }

  const analysisBatch = pickAnalysisBatch(context.players, context.latestAnalysisBatchId);

  const limit = await checkAiRateLimit(actor.teamId);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "AI 呼叫過於頻繁", retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSec) } },
    );
  }

  let gen: Awaited<ReturnType<typeof generateTeamFitnessTrainingAdvice>>;
  try {
    gen = await generateTeamFitnessTrainingAdvice({
      players: context.players,
      analysisBatch,
      supplement: body.supplement,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "MISSING_DEEPSEEK_API_KEY") {
      return NextResponse.json({ error: "伺服器未設定 DEEPSEEK_API_KEY" }, { status: 503 });
    }
    console.error(e);
    return NextResponse.json({ error: "AI 產生失敗" }, { status: 502 });
  }

  const adviceWithNames = replacePlayerKeysWithDisplayNames(
    gen.object.advice,
    context.players.map((player) => ({
      playerKey: player.playerKey,
      displayName: player.displayName,
      jerseyNumber: player.jerseyNumber,
    })),
  );

  const stored = teamFitnessTrainingAdviceSchema.parse({
    advice: adviceWithNames,
    supplement: body.supplement.trim(),
    generatedAt: new Date().toISOString(),
    model: gen.modelId,
    analysisBatchId: context.latestAnalysisBatchId,
    usage: gen.usage,
  });

  await prisma.team.update({
    where: { id: actor.teamId },
    data: { fitnessTeamTrainingAdvice: stored },
  });

  return NextResponse.json({ advice: stored });
}
