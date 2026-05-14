import { z } from "zod";

/** 手動建立／更新訓練段落（註解：order 省略時以陣列索引寫入）。 */
export const trainingBlockInputSchema = z.object({
  order: z.number().int().min(0).optional(),
  name: z.string().min(1),
  minutes: z.number().int().min(1),
  goal: z.string().min(1),
  setup: z.string().optional().nullable(),
  steps: z.array(z.string()).min(1),
  coachCues: z.array(z.string()).optional().nullable(),
  groupingPlan: z.string().optional().nullable(),
});

/** 寫入 TrainingPlan 的本文欄位 + blocks（註解：不含 aiProvenance，AI 路由另外寫）。 */
export const trainingPlanWriteSchema = z.object({
  title: z.string().optional().nullable(),
  summary: z.string().optional().nullable(),
  equipmentList: z.array(z.string()).optional().nullable(),
  safetyNotes: z.string().optional().nullable(),
  blocks: z.array(trainingBlockInputSchema).min(1),
});

export type TrainingPlanWriteInput = z.infer<typeof trainingPlanWriteSchema>;

/** AI 產出 JSON（註解：對齊規格 titleSuggestion、blocks[]、cooldown/homework）。 */
export const aiTrainingPlanOutputSchema = z.object({
  titleSuggestion: z.string().min(1),
  summary: z.string(),
  equipmentList: z.array(z.string()),
  safetyNotes: z.string(),
  blocks: z
    .array(
      z.object({
        name: z.string(),
        minutes: z.number().int().min(1),
        goal: z.string(),
        setup: z.string().optional(),
        steps: z.array(z.string()).min(1),
        coachCues: z.array(z.string()).optional(),
        groupingPlan: z.string().optional(),
      }),
    )
    .min(1),
  cooldown: z.string().optional(),
  homework: z.string().optional(),
});

export type AiTrainingPlanOutput = z.infer<typeof aiTrainingPlanOutputSchema>;
