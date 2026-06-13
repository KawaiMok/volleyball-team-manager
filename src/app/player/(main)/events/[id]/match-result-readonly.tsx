"use client";

import {
  MatchResultVisualization,
  type MatchResultViewData,
} from "@/app/coach/(main)/events/[id]/match-result-visualization";
import { DataViewModeToggle } from "@/components/data-view-mode-toggle";
import { useDataViewMode } from "@/components/data-view-mode-provider";
import { PersonalStatsChartGrid } from "@/components/match-stats-charts";
import { useMatchModule } from "@/components/team-sport-provider";
import type { PlayerStatsRecord } from "@/lib/sports/match/types";

type Props = {
  data: MatchResultViewData;
  teamName: string;
  currentMemberId: string;
};

function PersonalStatCard({ category, stats }: { category: string; stats: PlayerStatsRecord }) {
  const match = useMatchModule();
  if (!match.hasCategoryData(stats, category)) return null;

  const label = match.categoryLabels[category] ?? category;
  const fields = match.categoryFields[category] ?? [];
  const cat = stats[category] as Record<string, number>;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-zinc-900">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</h4>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {fields.map((f) => (
          <div key={f.key} className={f.derived ? "col-span-2" : undefined}>
            <dt className="text-slate-500">{f.label}</dt>
            <dd className="font-medium tabular-nums">
              {f.derived ? match.derivedStatValue(stats, f.derived) : (cat[f.key] ?? 0)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** 球員：僅顯示大比分與本人數據（註解：依運動模組動態分類）。 */
export function MatchResultReadonly({ data, teamName, currentMemberId }: Props) {
  const match = useMatchModule();
  const { mode } = useDataViewMode();
  const myRow = data.playerStats.find((p) => p.memberId === currentMemberId);
  const myStats = myRow?.stats;
  const filledCategories = match.categories.filter(
    (c) => myStats && match.hasCategoryData(myStats, c),
  );
  const hasPersonalStats = filledCategories.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">比賽結果</h3>
        <DataViewModeToggle variant="player" />
      </div>
      <MatchResultVisualization data={data} teamName={teamName} scoreOnly hideViewToggle />

      {hasPersonalStats && myStats ?
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">我的數據</h3>
          {mode === "chart" ?
            <PersonalStatsChartGrid stats={myStats} teamRows={data.playerStats} />
          : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filledCategories.map((c) => (
                <PersonalStatCard key={c} category={c} stats={myStats} />
              ))}
            </div>
          )}
        </section>
      : (
        <p className="text-sm text-slate-500 dark:text-slate-400">教練尚未登錄你的個人數據。</p>
      )}
    </div>
  );
}
