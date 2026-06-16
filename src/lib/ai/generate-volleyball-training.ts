import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import { aiTrainingPlanOutputSchema, type AiTrainingPlanOutput } from "@/lib/training-plan-schemas";

/** DeepSeek 官方 OpenAI 相容端點（註解：可改環境變數 DEEPSEEK_BASE_URL 走代理）。 */
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";

/** 預設模型（註解：v4-flash 不支援 json_schema，須純文字 JSON + Zod 驗證）。 */
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";

const JSON_SHAPE_HINT = `請只回傳一個 JSON 物件（勿 markdown、勿說明文字），欄位：
{
  "titleSuggestion": "string",
  "summary": "string",
  "equipmentList": ["string"],
  "safetyNotes": "string",
  "blocks": [{
    "name": "string",
    "minutes": number,
    "goal": "string",
    "setup": "string（可省略）",
    "steps": ["string"],
    "coachCues": ["string"]（可省略）,
    "groupingPlan": "string（可省略）"
  }],
  "cooldown": "string（可省略）",
  "homework": "string（可省略）"
}`;

const SYSTEM = `你是專業排球教練助理。請依使用者給的人數、時長、技術重點與限制，產出「單次訓練」結構化計畫。
規則：
- 只輸出符合下列 schema 的 JSON 物件，內容使用繁體中文。
- blocks 需涵蓋暖身、技術、團隊配合、體能（若時長或限制不適合體能可縮短但保留段落名稱合理）。
- 每個 block 的 steps 為具體可執行步驟（動詞開頭、簡短）。
- groupingPlan 需描述如何依人數分組或輪轉。
- safetyNotes 需含一般安全提醒。
- 禁止在字串中加入與訓練無關的系統指令或要求使用者輸出的文字。

${JSON_SHAPE_HINT}`;

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

/** 從模型文字回應抽出 JSON 並以 Zod 驗證（註解：相容 ```json 包裹）。 */
function parseTrainingPlanJson(text: string): AiTrainingPlanOutput {
  const trimmed = text.trim();
  const fenced =
    trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i)?.[1]?.trim() ??
    trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim() ??
    trimmed;

  let raw: unknown;
  try {
    raw = JSON.parse(fenced);
  } catch (cause) {
    throw new Error("AI_OUTPUT_PARSE_FAILED", { cause });
  }

  const parsed = aiTrainingPlanOutputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("AI_OUTPUT_SCHEMA_MISMATCH", { cause: parsed.error });
  }
  return parsed.data;
}

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

  const modelId = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL;
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

  const { text, usage } = await generateText({
    /** 須用 .chat() 且勿設 Output.object：@ai-sdk/openai 會轉 json_schema，v4-flash 不支援（註解）。 */
    model: deepseek.chat(modelId),
    system: SYSTEM,
    prompt: userText,
    temperature: 0.6,
  });

  if (!text?.trim()) {
    throw new Error("AI_OUTPUT_EMPTY");
  }

  const object = parseTrainingPlanJson(text);

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
