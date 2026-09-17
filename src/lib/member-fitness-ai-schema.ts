import { z } from "zod";

/** AI 回傳結構（註解：DeepSeek 純 JSON）。 */
export const memberFitnessAiOutputSchema = z.object({
  evaluation: z.string().min(1),
  trainingPlan: z.string().min(1),
});

export type MemberFitnessAiOutput = z.infer<typeof memberFitnessAiOutputSchema>;

/** 寫入 TeamMember.fitnessAiReport 的結構（註解：每次呼叫覆寫）。 */
export const memberFitnessAiReportSchema = z.object({
  evaluation: z.string(),
  trainingPlan: z.string(),
  supplement: z.string(),
  generatedAt: z.string(),
  model: z.string(),
  usage: z
    .object({
      promptTokens: z.number().optional(),
      completionTokens: z.number().optional(),
      totalTokens: z.number().optional(),
    })
    .optional(),
});

export type MemberFitnessAiReport = z.infer<typeof memberFitnessAiReportSchema>;

/** 由 Prisma Json 欄位解析已存報告（註解：無效則 null）。 */
export function parseMemberFitnessAiReport(raw: unknown): MemberFitnessAiReport | null {
  const parsed = memberFitnessAiReportSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}
