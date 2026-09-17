import { buildTeamFitnessAnalysisPromptPreview } from "@/lib/ai/generate-team-fitness-analysis";
import { loadTeamFitnessAiContext } from "@/lib/fitness/team-ai-context";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  supplement: z.string().max(2000).optional().default(""),
});

/** 預覽全隊體能分析 prompt（註解：不呼叫 AI）。 */
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
  if (context.players.length === 0) {
    return NextResponse.json({ error: "尚無在籍隊員" }, { status: 400 });
  }

  const preview = buildTeamFitnessAnalysisPromptPreview({
    players: context.players,
    supplement: body.supplement,
  });

  return NextResponse.json({ preview, playerCount: context.players.length });
}
