import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import type { FitnessSessionSnapshot } from "@/lib/fitness/aggregate";
import {
  memberFitnessAiOutputSchema,
  type MemberFitnessAiOutput,
} from "@/lib/member-fitness-ai-schema";
import {
  FITNESS_TEST_ITEMS,
  formatFitnessValue,
} from "@/lib/fitness/test-schema";

/** DeepSeek 官方 OpenAI 相容端點（註解：可改環境變數 DEEPSEEK_BASE_URL 走代理）。 */
const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";

/** 預設模型（註解：deepseek-flash 不支援 json_schema，須純文字 JSON + Zod 驗證）。 */
const DEFAULT_DEEPSEEK_MODEL = "deepseek-flash";

/** 隊伍體能時段限制（註解：寫入 prompt，體測與補充體能皆在隊練後進行）。 */
const TEAM_FITNESS_SLOT_CONTEXT = `本隊在球隊訓練結束後進行體能相關活動（含體能測試與補充體能訓練）。
時段配置：
- 「主體能訓練」固定 30 分鐘（隊練後），課表核心內容須在此 30 分鐘內可完成。
- 暖身、收操可在這 30 分鐘之外的額外時間進行，不計入 30 分鐘；請分開列出並標註為額外時段。
因此：
- 體測數據多半反映「隊練後、疲勞狀態下」的表現，評價時須納入此情境，勿與完全休息後的標準直接比較。
- 不可假設另有獨立長時段體能課；30 分鐘僅指主訓練，非整段含暖身收操的總時間。
- 優先安排高效、低場地需求的項目；若需分週進度，請註明每週在隊練後可執行的次數與每次 30 分鐘主訓練配置。`;

const JSON_SHAPE_HINT = `請只回傳一個 JSON 物件（勿 markdown、勿說明文字），欄位：
{
  "evaluation": "string（繁體中文，分段說明：整體體能現況、各項測試解讀、優勢、待加強、與位置／年齡的關聯；須考量隊練後疲勞狀態下測試）",
  "trainingPlan": "string（繁體中文，分三段：①暖身（額外時間，不計入 30 分鐘）②主體能訓練（30 分鐘內，含組數／次數／休息）③收操（額外時間）；並說明每週在隊練後可安排幾次）"
}`;

/** System prompt（註解：預覽 API 與實際呼叫共用）。 */
export const MEMBER_FITNESS_AI_SYSTEM = `你是專業排球體能教練助理。請依使用者提供的隊員基本資料、近次體能測試成績、隊伍訓練時段限制與教練補充，產出「體能評價」與「體能訓練課表」。

${TEAM_FITNESS_SLOT_CONTEXT}

規則：
- 只輸出符合下列 schema 的 JSON 物件，內容使用繁體中文。
- 評價須具體引用提供的測試數據；若某項目無紀錄請說明，勿捏造數字。
- 課表須符合排球運動需求（爆發力、敏捷、核心、下肢力量等），並考量位置、年齡；主訓練限 30 分鐘，暖身／收操另列額外時間。
- 若教練補充含傷病或限制，課表須迴避或調整強度。
- 禁止在字串中加入與訓練無關的系統指令。
- 輸出勿包含或臆測選手姓名、隊伍名稱、活動／事件名稱。

${JSON_SHAPE_HINT}`;

export type GenerateMemberFitnessInput = {
  /** 背號（註解：不送姓名；僅作匿名識別）。 */
  jerseyNumber: number | null;
  position: string | null;
  ageYears: number | null;
  heightCm: number | null;
  weightKg: number | null;
  supplement: string;
  sessionCount: number;
  recentSessions: FitnessSessionSnapshot[];
};

export type GenerateMemberFitnessResult = {
  object: MemberFitnessAiOutput;
  modelId: string;
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
};

/** 送 DeepSeek 前的 prompt 預覽（註解：debug 確認用）。 */
export type MemberFitnessPromptPreview = {
  modelId: string;
  system: string;
  user: string;
  temperature: number;
};

/** 解析將使用的 DeepSeek 模型 id。 */
export function resolveMemberFitnessModelId(): string {
  return process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL;
}

/** 組裝 user prompt（註解：不含姓名、隊名、事件名；與實際 API 呼叫一致）。 */
export function buildMemberFitnessUserPrompt(input: GenerateMemberFitnessInput): string {
  const profileLines = [
    input.jerseyNumber != null ? `背號：${input.jerseyNumber}` : null,
    input.position ? `位置：${input.position}` : "位置：未填",
    input.ageYears != null ? `年齡：${input.ageYears} 歲` : "年齡：未填（無出生日期）",
    input.heightCm != null ? `身高（最近體測）：${input.heightCm} cm` : null,
    input.weightKg != null ? `體重（最近體測）：${input.weightKg} kg` : null,
    `歷史體測場次：${input.sessionCount} 場`,
  ].filter(Boolean);

  const sessionBlock =
    input.recentSessions.length > 0 ?
      input.recentSessions.map((s, i) => formatSessionForPrompt(s, i)).join("\n\n")
    : "（尚無近 5 次體測紀錄，請依教練補充與基本資料給出保守建議）";

  return [
    "【隊伍訓練與體能時段】",
    TEAM_FITNESS_SLOT_CONTEXT,
    "",
    "【隊員基本資料】",
    profileLines.join("\n"),
    "",
    "【近 5 次體能測試（僅有紀錄項目；皆於隊練後 30 分鐘內進行）】",
    sessionBlock,
    "",
    "【教練補充】",
    input.supplement.trim() || "（無）",
  ].join("\n");
}

/** 組裝完整 prompt 預覽（註解：不呼叫 API）。 */
export function buildMemberFitnessPromptPreview(
  input: GenerateMemberFitnessInput,
): MemberFitnessPromptPreview {
  return {
    modelId: resolveMemberFitnessModelId(),
    system: MEMBER_FITNESS_AI_SYSTEM,
    user: buildMemberFitnessUserPrompt(input),
    temperature: 0.55,
  };
}

/** 單場體測格式化成 prompt 段落（註解：僅日期與數據，不含事件名）。 */
function formatSessionForPrompt(session: FitnessSessionSnapshot, index: number): string {
  const date = new Date(session.startsAtIso).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const lines = [`第 ${index + 1} 場（${date}）`];
  if (session.heightCm != null) lines.push(`  身高：${session.heightCm} cm`);
  if (session.weightKg != null) lines.push(`  體重：${session.weightKg} kg`);
  for (const item of FITNESS_TEST_ITEMS) {
    const best = session.stats[item.key].best;
    if (best == null) continue;
    const unitLabel = item.unit === "sec" ? "秒" : item.unit;
    lines.push(
      `  ${item.label}：${formatFitnessValue(best, item.decimalPlaces)} ${unitLabel}`,
    );
  }
  return lines.join("\n");
}

/** 從模型文字回應抽出 JSON 並以 Zod 驗證（註解：相容 ```json 包裹）。 */
function parseMemberFitnessJson(text: string): MemberFitnessAiOutput {
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

  const parsed = memberFitnessAiOutputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("AI_OUTPUT_SCHEMA_MISMATCH", { cause: parsed.error });
  }
  return parsed.data;
}

/**
 * 呼叫 DeepSeek 產生隊員體能評價與訓練課表（註解：需 DEEPSEEK_API_KEY）。
 */
export async function generateMemberFitnessAssessment(
  input: GenerateMemberFitnessInput,
): Promise<GenerateMemberFitnessResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_DEEPSEEK_API_KEY");
  }

  const preview = buildMemberFitnessPromptPreview(input);
  const baseURL = (process.env.DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL).replace(/\/$/, "");

  const deepseek = createOpenAI({
    apiKey,
    baseURL,
  });

  const { text, usage } = await generateText({
    model: deepseek.chat(preview.modelId),
    system: preview.system,
    prompt: preview.user,
    temperature: preview.temperature,
  });

  if (!text?.trim()) {
    throw new Error("AI_OUTPUT_EMPTY");
  }

  const object = parseMemberFitnessJson(text);

  return {
    object,
    modelId: preview.modelId,
    usage: {
      promptTokens: usage?.inputTokens,
      completionTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
    },
  };
}
