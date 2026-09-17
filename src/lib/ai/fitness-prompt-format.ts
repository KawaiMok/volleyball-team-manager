import type { FitnessSessionSnapshot } from "@/lib/fitness/aggregate";
import {
  FITNESS_TEST_ITEMS,
  formatFitnessValue,
} from "@/lib/fitness/test-schema";

/** 單場體測格式化成 prompt 段落（註解：僅日期與數據，不含事件名）。 */
export function formatFitnessSessionForPrompt(session: FitnessSessionSnapshot, index: number): string {
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
    lines.push(`  ${item.label}：${formatFitnessValue(best, item.decimalPlaces)} ${unitLabel}`);
  }
  return lines.join("\n");
}

/** 選手代號顯示（註解：prompt 用，不含姓名）。 */
export function formatPlayerKeyLabel(playerKey: string, jerseyNumber: number | null): string {
  return jerseyNumber != null ? `${playerKey}（背號 ${jerseyNumber}）` : playerKey;
}
