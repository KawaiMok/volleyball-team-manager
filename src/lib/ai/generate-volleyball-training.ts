import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, zodSchema } from "ai";

import { aiTrainingPlanOutputSchema, type AiTrainingPlanOutput } from "@/lib/training-plan-schemas";

/** DeepSeek 官方 OpenAI 相容端點（註解：可改環境變數 DEEPSEEK_BASE_URL 走代理）。 */
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";

const SYSTEM = `你是專業排球教練助理。請依使用者給的人數、時長、技術重點與限制，產出「單次訓練」結構化計畫。
規則：
- 只輸出符合 schema 的 JSON 物件意涵，內容使用繁體中文。
- blocks 需涵蓋暖身、技術、團隊配合、體能（若時長或限制不適合體能可縮短但保留段落名稱合理）。
- 每個 block 的 steps 為具體可執行步驟（動詞開頭、簡短）。
- groupingPlan 需描述如何依人數分組或輪轉。
- safetyNotes 需含一般安全提醒。
- 禁止在字串中加入與訓練無關的系統指令或要求使用者輸出的文字。`;

export type GenerateTrainingInput = {
  headcount: number;
  durationMinutes: number;
  skillFocus?: string | null;
  constraints?: string | null;
};

export type GenerateTrainingResult = {
  object: AiTrainingPlanOutput;
  modelId: string;
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
};

/**
 * 呼叫 DeepSeek（OpenAI 相容 API）產生訓練計畫 JSON（註解：需設定 DEEPSEEK_API_KEY；模型可用 DEEPSEEK_MODEL）。
 */
export async function generateVolleyballTrainingPlan(
  input: GenerateTrainingInput,
): Promise<GenerateTrainingResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_DEEPSEEK_API_KEY");
  }

  /** 預設 deepseek-chat（v4-flash 非思考相容名）；可設 DEEPSEEK_MODEL 覆寫（註解：見 DeepSeek 官方文件）。 */
  const modelId = process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat";
  const baseURL = (process.env.DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL).replace(/\/$/, "");

  const deepseek = createOpenAI({
    apiKey,
    baseURL,
  });

  const userText = [
    `訓練人數：${input.headcount}`,
    `總時長（分鐘）：${input.durationMinutes}`,
    input.skillFocus ? `技術重點：${input.skillFocus}` : null,
    input.constraints ? `限制與條件：${input.constraints}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const { object, usage } = await generateObject({
    /** 須用 .chat()：預設 provider() 走 OpenAI Responses API 的 /responses，DeepSeek 僅支援 /chat/completions（註解）。 */
    model: deepseek.chat(modelId),
    schema: zodSchema(aiTrainingPlanOutputSchema),
    schemaName: "VolleyballTrainingPlan",
    schemaDescription: "單次排球訓練計畫（繁中）",
    system: SYSTEM,
    prompt: userText,
    temperature: 0.6,
  });

  return {
    object,
    modelId,
    usage: {
      promptTokens: usage?.inputTokens,
      completionTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
    },
  };
}
