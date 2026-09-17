import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import {
  FITNESS_AI_PRIVACY_RULES,
  FITNESS_TEST_MEASUREMENT_CONTEXT,
} from "@/lib/ai/fitness-ai-prompt-context";
import {
  formatFitnessSessionForPrompt,
  formatPlayerKeyLabel,
} from "@/lib/ai/fitness-prompt-format";
import type { TeamPlayerFitnessAiRow } from "@/lib/fitness/team-ai-context";
import {
  teamFitnessAnalysisOutputSchema,
  type TeamFitnessAnalysisOutput,
} from "@/lib/team-fitness-ai-schema";

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-flash";

const JSON_SHAPE_HINT = `請只回傳一個 JSON 物件（勿 markdown、勿說明文字），欄位：
{
  "rankings": [
    { "playerKey": "P1", "rank": 1, "comment": "string（繁體中文，該選手體能分析評語，須引用測試數據；勿寫訓練課表或處方）" }
  ]
}`;

const SYSTEM = `你是專業排球體能分析助理。請依使用者提供的全隊選手體能測試資料、體測情境與教練補充，對每位選手進行「隊內體能排名」並給予個別分析評語。

${FITNESS_TEST_MEASUREMENT_CONTEXT}

規則：
- 只輸出符合下列 schema 的 JSON 物件，內容使用繁體中文。
- 須為每位有資料的 playerKey 產出 rank 與 comment；rank 為正整數，1 為最佳（可並列同 rank）。
- 排名須綜合近次體測表現、位置需求與年齡；comment 須具體引用數據，勿捏造。
- comment 僅限體能現況分析與排名理由；勿提供訓練課表、訓練處方、組數次數或週期安排。
- ${FITNESS_AI_PRIVACY_RULES}

${JSON_SHAPE_HINT}`;

export type TeamFitnessAnalysisPromptInput = {
  players: TeamPlayerFitnessAiRow[];
  supplement: string;
};

export type TeamFitnessPromptPreview = {
  modelId: string;
  system: string;
  user: string;
  temperature: number;
};

export type GenerateTeamFitnessAnalysisResult = {
  object: TeamFitnessAnalysisOutput;
  modelId: string;
  usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
};

export function resolveTeamFitnessModelId(): string {
  return process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_DEEPSEEK_MODEL;
}

function formatPlayerBlock(player: TeamPlayerFitnessAiRow): string {
  const header = formatPlayerKeyLabel(player.playerKey, player.jerseyNumber);
  const profileLines = [
    `playerKey：${player.playerKey}`,
    player.position ? `位置：${player.position}` : "位置：未填",
    player.ageYears != null ? `年齡：${player.ageYears} 歲` : "年齡：未填（無出生日期）",
    player.heightCm != null ? `身高（最近體測）：${player.heightCm} cm` : null,
    player.weightKg != null ? `體重（最近體測）：${player.weightKg} kg` : null,
    `歷史體測場次：${player.sessionCount} 場`,
  ].filter(Boolean);

  const sessionBlock =
    player.recentSessions.length > 0 ?
      player.recentSessions.map((s, i) => formatFitnessSessionForPrompt(s, i)).join("\n")
    : "（尚無近 5 次體測紀錄）";

  return [
    `--- ${header} ---`,
    profileLines.join("\n"),
    "近 5 次體能測試（僅有紀錄項目；於隊練後進行）：",
    sessionBlock,
  ].join("\n");
}

/** 組裝體能分析 user prompt（註解：不含姓名、隊名、事件名）。 */
export function buildTeamFitnessAnalysisUserPrompt(input: TeamFitnessAnalysisPromptInput): string {
  const playerBlocks =
    input.players.length > 0 ?
      input.players.map(formatPlayerBlock).join("\n\n")
    : "（尚無在籍隊員）";

  return [
    "【體測情境】",
    FITNESS_TEST_MEASUREMENT_CONTEXT,
    "",
    "【全隊選手體能測試資料】",
    "每位選手以 playerKey 識別（如 P1、P2），請在 rankings 中使用相同 playerKey。",
    "",
    playerBlocks,
    "",
    "【教練補充】",
    input.supplement.trim() || "（無）",
  ].join("\n");
}

export function buildTeamFitnessAnalysisPromptPreview(
  input: TeamFitnessAnalysisPromptInput,
): TeamFitnessPromptPreview {
  return {
    modelId: resolveTeamFitnessModelId(),
    system: SYSTEM,
    user: buildTeamFitnessAnalysisUserPrompt(input),
    temperature: 0.5,
  };
}

function parseAnalysisJson(text: string): TeamFitnessAnalysisOutput {
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

  const parsed = teamFitnessAnalysisOutputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("AI_OUTPUT_SCHEMA_MISMATCH", { cause: parsed.error });
  }
  return parsed.data;
}

/** 呼叫 DeepSeek 產生全隊體能排名與評語（註解：需 DEEPSEEK_API_KEY）。 */
export async function generateTeamFitnessAnalysis(
  input: TeamFitnessAnalysisPromptInput,
): Promise<GenerateTeamFitnessAnalysisResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_DEEPSEEK_API_KEY");
  }

  const preview = buildTeamFitnessAnalysisPromptPreview(input);
  const baseURL = (process.env.DEEPSEEK_BASE_URL ?? DEFAULT_DEEPSEEK_BASE_URL).replace(/\/$/, "");
  const deepseek = createOpenAI({ apiKey, baseURL });

  const { text, usage } = await generateText({
    model: deepseek.chat(preview.modelId),
    system: preview.system,
    prompt: preview.user,
    temperature: preview.temperature,
  });

  if (!text?.trim()) {
    throw new Error("AI_OUTPUT_EMPTY");
  }

  return {
    object: parseAnalysisJson(text),
    modelId: preview.modelId,
    usage: {
      promptTokens: usage?.inputTokens,
      completionTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
    },
  };
}
