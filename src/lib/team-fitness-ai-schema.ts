import { z } from "zod";

/** 體能分析 AI 回傳（註解：DeepSeek 純 JSON）。 */
export const teamFitnessAnalysisOutputSchema = z.object({
  rankings: z
    .array(
      z.object({
        playerKey: z.string().min(1),
        rank: z.number().int().min(1),
        comment: z.string().min(1),
      }),
    )
    .min(1),
});

export type TeamFitnessAnalysisOutput = z.infer<typeof teamFitnessAnalysisOutputSchema>;

/** 寫入 TeamMember.fitnessAiReport（註解：體能分析排名與評語；每次批次覆寫）。 */
export const memberFitnessAiAnalysisSchema = z.object({
  rank: z.number().int().min(1),
  comment: z.string(),
  supplement: z.string(),
  generatedAt: z.string(),
  model: z.string(),
  batchId: z.string(),
  usage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional(),
    })
    .optional(),
});

export type MemberFitnessAiAnalysis = z.infer<typeof memberFitnessAiAnalysisSchema>;

/** 團體訓練建議 AI 回傳。 */
export const teamFitnessTrainingAdviceOutputSchema = z.object({
  advice: z.string().min(1),
});

export type TeamFitnessTrainingAdviceOutput = z.infer<typeof teamFitnessTrainingAdviceOutputSchema>;

/** 寫入 Team.fitnessTeamTrainingAdvice（註解：每次呼叫覆寫）。 */
export const teamFitnessTrainingAdviceSchema = z.object({
  advice: z.string(),
  supplement: z.string(),
  generatedAt: z.string(),
  model: z.string(),
  analysisBatchId: z.string(),
  usage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional(),
    })
    .optional(),
});

export type TeamFitnessTrainingAdvice = z.infer<typeof teamFitnessTrainingAdviceSchema>;

/** 解析隊員已存體能分析（註解：舊版 evaluation 格式視為無效）。 */
export function parseMemberFitnessAiAnalysis(raw: unknown): MemberFitnessAiAnalysis | null {
  const parsed = memberFitnessAiAnalysisSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** 解析隊伍已存團體訓練建議。 */
export function parseTeamFitnessTrainingAdvice(raw: unknown): TeamFitnessTrainingAdvice | null {
  const parsed = teamFitnessTrainingAdviceSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
