import type { FatigueLevel, PainLevel } from "@/generated/prisma/client";

export function fatigueLabel(f: FatigueLevel): string {
  switch (f) {
    case "LOW":
      return "低";
    case "MED":
      return "中";
    case "HIGH":
      return "高";
    default:
      return f;
  }
}

export function painLabel(p: PainLevel): string {
  switch (p) {
    case "NONE":
      return "無";
    case "MILD":
      return "輕微";
    case "SEVERE":
      return "明顯";
    default:
      return p;
  }
}

/** 疲勞等級 → 0–2（圖表用）。 */
export function fatigueLevelIndex(f: FatigueLevel): number {
  switch (f) {
    case "LOW":
      return 0;
    case "MED":
      return 1;
    case "HIGH":
      return 2;
  }
}

/** 疼痛等級 → 0–2（圖表用）。 */
export function painLevelIndex(p: PainLevel): number {
  switch (p) {
    case "NONE":
      return 0;
    case "MILD":
      return 1;
    case "SEVERE":
      return 2;
  }
}

export function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export type FeedbackDisplayData = {
  rpe: number;
  fatigue: FatigueLevel;
  painLevel: PainLevel;
  painArea: string | null;
  note: string | null;
  submittedAt: Date | string;
  displayName?: string;
};

/** 單行摘要（列表用）。 */
export function feedbackOneLineSummary(data: Pick<FeedbackDisplayData, "rpe" | "fatigue" | "painLevel" | "painArea">): string {
  let s = `RPE ${data.rpe} · 疲勞${fatigueLabel(data.fatigue)} · 疼痛${painLabel(data.painLevel)}`;
  if (data.painArea?.trim()) s += `（${data.painArea.trim()}）`;
  return s;
}
