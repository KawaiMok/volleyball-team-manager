"use client";

import {
  TeamFitnessAiWorkflowPanel,
  formatAiGeneratedAt,
} from "@/components/team-fitness-ai-workflow-panel";
import type { TeamFitnessTrainingAdvice } from "@/lib/team-fitness-ai-schema";

type Props = {
  advice: TeamFitnessTrainingAdvice | null;
  hasAnalysis: boolean;
};

/** 總覽：團體體能訓練建議。 */
export function CoachDashboardFitnessTrainingSection({ advice, hasAnalysis }: Props) {
  return (
    <TeamFitnessAiWorkflowPanel
      title="體能訓練建議"
      description="依全隊體測、體能分析排名／評語與教練補充（時段、時長、頻率、限制等）產生團體訓練建議；每次覆寫。"
      actionLabel="產生訓練建議"
      supplementPlaceholder="例如：隊練後 30 分鐘體能、每週 2 次、暖身收操另計、場地僅半場、器材有限…"
      supplementHint="請在此說明你的隊伍訓練時段、每次時長與限制；AI 不會預設固定 30 分鐘。"
      previewUrl="/api/team/fitness-ai/training-advice/preview"
      runUrl="/api/team/fitness-ai/training-advice"
      disabled={!hasAnalysis}
      disabledHint="請先完成「體能分析」，訓練建議才會引用排名與評語。"
      storedSummary={
        advice ?
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              產生於 {formatAiGeneratedAt(advice.generatedAt, advice.model)}
            </p>
            {advice.supplement ?
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                <span className="font-medium">教練補充：</span>
                {advice.supplement}
              </p>
            : null}
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
              {advice.advice}
            </div>
          </div>
        : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">尚無團體訓練建議。</p>
        )
      }
    />
  );
}
