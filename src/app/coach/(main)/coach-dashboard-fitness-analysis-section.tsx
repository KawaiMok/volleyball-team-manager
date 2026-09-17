"use client";

import {
  TeamFitnessAiWorkflowPanel,
  formatAiGeneratedAt,
} from "@/components/team-fitness-ai-workflow-panel";
import type { MemberFitnessAiAnalysis } from "@/lib/team-fitness-ai-schema";

export type FitnessAnalysisRosterRow = {
  memberId: string;
  displayName: string;
  jerseyNumber: number | null;
  analysis: MemberFitnessAiAnalysis | null;
};

type Props = {
  rows: FitnessAnalysisRosterRow[];
};

/** 總覽：全隊體能分析（排名 + 評語）。 */
export function CoachDashboardFitnessAnalysisSection({ rows }: Props) {
  const ranked = rows
    .filter((r) => r.analysis != null)
    .sort((a, b) => (a.analysis!.rank - b.analysis!.rank));

  return (
    <TeamFitnessAiWorkflowPanel
      title="體能分析"
      description="彙整全隊近 5 次體測、身高、體重、年齡與教練補充，由 DeepSeek 產生隊內排名與分析評語（不含訓練課表）；結果寫入各隊員 profile，每次覆寫。"
      actionLabel="產生體能分析"
      previewUrl="/api/team/fitness-ai/analysis/preview"
      runUrl="/api/team/fitness-ai/analysis"
      storedSummary={
        ranked.length > 0 ?
          <div className="space-y-3">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              最新分析 · {formatAiGeneratedAt(ranked[0]!.analysis!.generatedAt, ranked[0]!.analysis!.model)}
            </p>
            <ol className="space-y-2">
              {ranked.map((r) => (
                <li
                  key={r.memberId}
                  className="rounded-lg border border-zinc-100 bg-zinc-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/50"
                >
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    #{r.analysis!.rank}{" "}
                    {r.displayName}
                    {r.jerseyNumber != null ? ` · 背號 ${r.jerseyNumber}` : ""}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {r.analysis!.comment}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">尚無體能分析結果。</p>
        )
      }
    />
  );
}
