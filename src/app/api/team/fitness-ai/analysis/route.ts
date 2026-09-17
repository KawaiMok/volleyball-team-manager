import { randomUUID } from "node:crypto";

import { Prisma } from "@/generated/prisma/client";
import { generateTeamFitnessAnalysis } from "@/lib/ai/generate-team-fitness-analysis";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { loadTeamFitnessAiContext } from "@/lib/fitness/team-ai-context";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import {
  memberFitnessAiAnalysisSchema,
  type MemberFitnessAiAnalysis,
} from "@/lib/team-fitness-ai-schema";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  supplement: z.string().max(2000).optional().default(""),
});

/** 全隊體能分析：排名 + 評語寫入各隊員 fitnessAiReport（註解：每次覆寫）。 */
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
  if (context.players.length === 0) {
    return NextResponse.json({ error: "尚無在籍隊員" }, { status: 400 });
  }

  const limit = await checkAiRateLimit(actor.teamId);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "AI 呼叫過於頻繁", retryAfterSec: limit.retryAfterSec },
      { status: 429, headers: { "retry-after": String(limit.retryAfterSec) } },
    );
  }

  let gen: Awaited<ReturnType<typeof generateTeamFitnessAnalysis>>;
  try {
    gen = await generateTeamFitnessAnalysis({
      players: context.players,
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

  const keyToMember = new Map(context.players.map((p) => [p.playerKey, p.memberId]));
  const batchId = randomUUID();
  const generatedAt = new Date().toISOString();
  const supplement = body.supplement.trim();

  const updates: Array<{ memberId: string; report: MemberFitnessAiAnalysis }> = [];
  for (const row of gen.object.rankings) {
    const memberId = keyToMember.get(row.playerKey);
    if (!memberId) continue;
    updates.push({
      memberId,
      report: memberFitnessAiAnalysisSchema.parse({
        rank: row.rank,
        comment: row.comment,
        supplement,
        generatedAt,
        model: gen.modelId,
        batchId,
        usage: gen.usage,
      }),
    });
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "AI 回傳的 playerKey 無法對應隊員" }, { status: 502 });
  }

  const memberIds = context.players.map((p) => p.memberId);

  await prisma.$transaction([
    prisma.teamMember.updateMany({
      where: { teamId: actor.teamId, id: { in: memberIds } },
      data: { fitnessAiReport: Prisma.DbNull },
    }),
    ...updates.map((u) =>
      prisma.teamMember.update({
        where: { id: u.memberId },
        data: { fitnessAiReport: u.report },
      }),
    ),
  ]);

  return NextResponse.json({
    batchId,
    updatedCount: updates.length,
    rankings: updates.map((u) => ({
      memberId: u.memberId,
      rank: u.report.rank,
      comment: u.report.comment,
    })),
  });
}
