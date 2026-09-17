import { buildMemberFitnessPromptPreview } from "@/lib/ai/generate-member-fitness-assessment";
import { loadMemberFitnessAiContext } from "@/lib/fitness/member-ai-context";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";
import { z } from "zod";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  /** 教練補充（註解：與正式呼叫相同）。 */
  supplement: z.string().max(2000).optional().default(""),
});

/**
 * 預覽將送 DeepSeek 的 prompt（註解：debug 用，不呼叫 AI、不計 rate limit）。
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

  const preview = buildMemberFitnessPromptPreview({
    jerseyNumber: context.jerseyNumber,
    position: context.position,
    ageYears: context.ageYears,
    heightCm: context.heightCm,
    weightKg: context.weightKg,
    supplement: body.supplement,
    sessionCount: context.sessionCount,
    recentSessions: context.recentSessions,
  });

  return NextResponse.json({ preview });
}
