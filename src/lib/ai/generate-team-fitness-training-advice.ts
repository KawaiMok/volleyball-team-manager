import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

import {
  FITNESS_AI_PRIVACY_RULES,
  TEAM_FITNESS_TRAINING_CONTEXT,
} from "@/lib/ai/fitness-ai-prompt-context";
import {
  formatFitnessSessionForPrompt,
  formatPlayerKeyLabel,
} from "@/lib/ai/fitness-prompt-format";
import type { TeamPlayerFitnessAiRow } from "@/lib/fitness/team-ai-context";
import {
  teamFitnessTrainingAdviceOutputSchema,
  type TeamFitnessTrainingAdviceOutput,
} from "@/lib/team-fitness-ai-schema";

const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-flash";

const JSON_SHAPE_HINT = `請只回傳一個 JSON 物件（勿 markdown、勿說明文字），欄位：
{
  "advice": "string（繁體中文，團體體能訓練建議：依教練補充的時段與限制規劃；可含暖身、主訓練、收操、分組／輪替與每週頻率；勿假設未提供的固定時長）"
}`;

const SYSTEM = `你是專業排球體能教練助理。請依全隊選手體能資料、最新體能分析排名與評語，以及教練補充的訓練條件，產出「團體體能訓練建議」。

${TEAM_FITNESS_TRAINING_CONTEXT}

規則：
- 只輸出符合下列 schema 的 JSON 物件，內容使用繁體中文。
- 建議須針對整隊規劃（非個人私教課），可說明如何依排名分組或輪替。
- 須引用體能分析排名／評語中的重點，並對應到訓練安排。
- 時長、頻率、場地等限制僅能來自教練補充；未提供時不得寫死特定分鐘數。
- ${FITNESS_AI_PRIVACY_RULES}

${JSON_SHAPE_HINT}`;

export type TeamFitnessTrainingAdvicePromptInput = {
  players: TeamPlayerFitnessAiRow[];
  analysisBatch: TeamPlayerFitnessAiRow[];
  supplement: string;
};

export type TeamFitnessPromptPreview = {
  modelId: string;
  system: string;
  user: string;
  temperature: number;
};

export type GenerateTeamFitnessTrainingAdviceResult = {
  object: TeamFitnessTrainingAdviceOutput;
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
    player.ageYears != null ? `年齡：${player.ageYears} 歲` : "年齡：未填",
    player.heightCm != null ? `身高：${player.heightCm} cm` : null,
    player.weightKg != null ? `體重：${player.weightKg} kg` : null,
    `歷史體測場次：${player.sessionCount} 場`,
  ].filter(Boolean);

  const sessionBlock =
    player.recentSessions.length > 0 ?
      player.recentSessions.map((s, i) => formatFitnessSessionForPrompt(s, i)).join("\n")
    : "（尚無近 5 次體測紀錄）";

  return [header, profileLines.join("\n"), sessionBlock].join("\n");
}

function formatAnalysisSummary(batch: TeamPlayerFitnessAiRow[]): string {
  if (batch.length === 0) return "（尚無體能分析結果，請先執行體能分析）";
  return batch
    .map((p) => {
      const a = p.analysis!;
      return `${formatPlayerKeyLabel(p.playerKey, p.jerseyNumber)}｜排名 ${a.rank}：${a.comment}`;
    })
    .join("\n");
}

/** 組裝團體訓練建議 user prompt。 */
export function buildTeamFitnessTrainingAdviceUserPrompt(
  input: TeamFitnessTrainingAdvicePromptInput,
): string {
  const playerBlocks =
    input.players.length > 0 ?
      input.players.map(formatPlayerBlock).join("\n\n")
    : "（尚無在籍隊員）";

  return [
    "【訓練條件說明】",
    TEAM_FITNESS_TRAINING_CONTEXT,
    "",
    "【最新體能分析：排名與評語】",
    formatAnalysisSummary(input.analysisBatch),
    "",
    "【全隊選手體能資料】",
    playerBlocks,
    "",
    "【教練補充】",
    input.supplement.trim() || "（無）",
  ].join("\n");
}

export function buildTeamFitnessTrainingAdvicePromptPreview(
  input: TeamFitnessTrainingAdvicePromptInput,
): TeamFitnessPromptPreview {
  return {
    modelId: resolveTeamFitnessModelId(),
    system: SYSTEM,
    user: buildTeamFitnessTrainingAdviceUserPrompt(input),
    temperature: 0.55,
  };
}

function parseAdviceJson(text: string): TeamFitnessTrainingAdviceOutput {
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

  const parsed = teamFitnessTrainingAdviceOutputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("AI_OUTPUT_SCHEMA_MISMATCH", { cause: parsed.error });
  }
  return parsed.data;
}

/** 呼叫 DeepSeek 產生團體體能訓練建議。 */
export async function generateTeamFitnessTrainingAdvice(
  input: TeamFitnessTrainingAdvicePromptInput,
): Promise<GenerateTeamFitnessTrainingAdviceResult> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error("MISSING_DEEPSEEK_API_KEY");
  }

  const preview = buildTeamFitnessTrainingAdvicePromptPreview(input);
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
    object: parseAdviceJson(text),
    modelId: preview.modelId,
    usage: {
      promptTokens: usage?.inputTokens,
      completionTokens: usage?.outputTokens,
      totalTokens: usage?.totalTokens,
    },
  };
}
