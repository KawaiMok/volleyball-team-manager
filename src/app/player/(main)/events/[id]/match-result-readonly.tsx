"use client";

import {
  MatchResultVisualization,
  type MatchResultViewData,
} from "@/app/coach/(main)/events/[id]/match-result-visualization";
import {
  computeAttackRates,
  computeBlockRating,
  computeDefenseRate,
  computePassRating,
  computeServeRating,
  formatPct,
  formatRating,
} from "@/lib/match-player-stats-metrics";
import {
  hasCategoryData,
  STAT_CATEGORIES,
  STAT_CATEGORY_LABELS,
  type PlayerMatchStats,
  type StatCategory,
} from "@/lib/match-result-schema";

type Props = {
  data: MatchResultViewData;
  teamName: string;
  currentMemberId: string;
};

function PersonalStatCard({
  category,
  stats,
}: {
  category: StatCategory;
  stats: PlayerMatchStats;
}) {
  if (!hasCategoryData(stats, category)) return null;

  const label = STAT_CATEGORY_LABELS[category];

  if (category === "attack") {
    const a = stats.attack!;
    const rates = computeAttackRates(stats);
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-zinc-900">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</h4>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div><dt className="text-slate-500">次數</dt><dd className="font-medium tabular-nums">{a.attempts}</dd></div>
          <div><dt className="text-slate-500">得分</dt><dd className="font-medium tabular-nums">{a.points}</dd></div>
          <div><dt className="text-slate-500">失誤</dt><dd className="font-medium tabular-nums">{a.errors}</dd></div>
          <div><dt className="text-slate-500">得分率</dt><dd className="font-medium tabular-nums">{formatPct(rates.scoreRate)}</dd></div>
          <div><dt className="text-slate-500">失誤率</dt><dd className="font-medium tabular-nums">{formatPct(rates.errorRate)}</dd></div>
        </dl>
      </div>
    );
  }

  if (category === "block") {
    const b = stats.block!;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-zinc-900">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</h4>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div><dt className="text-slate-500">次數</dt><dd className="font-medium tabular-nums">{b.attempts}</dd></div>
          <div><dt className="text-slate-500">有效</dt><dd className="font-medium tabular-nums">{b.effective}</dd></div>
          <div><dt className="text-slate-500">失誤</dt><dd className="font-medium tabular-nums">{b.errors}</dd></div>
          <div><dt className="text-slate-500">得分</dt><dd className="font-medium tabular-nums">{b.points}</dd></div>
          <div className="col-span-2"><dt className="text-slate-500">攔網 rating</dt><dd className="font-medium tabular-nums">{formatRating(computeBlockRating(stats))}</dd></div>
        </dl>
      </div>
    );
  }

  if (category === "defense") {
    const d = stats.defense!;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-zinc-900">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</h4>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div><dt className="text-slate-500">次數</dt><dd className="font-medium tabular-nums">{d.attempts}</dd></div>
          <div><dt className="text-slate-500">成功</dt><dd className="font-medium tabular-nums">{d.success}</dd></div>
          <div><dt className="text-slate-500">失誤</dt><dd className="font-medium tabular-nums">{d.errors}</dd></div>
          <div><dt className="text-slate-500">有效防守%</dt><dd className="font-medium tabular-nums">{formatPct(computeDefenseRate(stats))}</dd></div>
        </dl>
      </div>
    );
  }

  if (category === "pass") {
    const p = stats.pass!;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-zinc-900">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</h4>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div><dt className="text-slate-500">A 完美</dt><dd className="font-medium tabular-nums">{p.perfect}</dd></div>
          <div><dt className="text-slate-500">B 僅入3米</dt><dd className="font-medium tabular-nums">{p.good}</dd></div>
          <div><dt className="text-slate-500">C 修正或更差</dt><dd className="font-medium tabular-nums">{p.poor}</dd></div>
          <div><dt className="text-slate-500">被 ACE</dt><dd className="font-medium tabular-nums">{p.aced}</dd></div>
          <div className="col-span-2"><dt className="text-slate-500">一傳 rating</dt><dd className="font-medium tabular-nums">{formatRating(computePassRating(stats))}</dd></div>
        </dl>
      </div>
    );
  }

  if (category === "serve") {
    const s = stats.serve!;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-zinc-900">
        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</h4>
        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <div><dt className="text-slate-500">A 強</dt><dd className="font-medium tabular-nums">{s.strong}</dd></div>
          <div><dt className="text-slate-500">B 一般</dt><dd className="font-medium tabular-nums">{s.normal}</dd></div>
          <div><dt className="text-slate-500">C 菜</dt><dd className="font-medium tabular-nums">{s.weak}</dd></div>
          <div><dt className="text-slate-500">失誤</dt><dd className="font-medium tabular-nums">{s.errors}</dd></div>
          <div><dt className="text-slate-500">ACE</dt><dd className="font-medium tabular-nums">{s.aces}</dd></div>
          <div className="col-span-2"><dt className="text-slate-500">發球 rating</dt><dd className="font-medium tabular-nums">{formatRating(computeServeRating(stats))}</dd></div>
        </dl>
      </div>
    );
  }

  const o = stats.other!;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-zinc-900">
      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{label}</h4>
      <dl className="mt-2 text-sm">
        <div><dt className="text-slate-500">失誤</dt><dd className="font-medium tabular-nums">{o.errors}</dd></div>
      </dl>
    </div>
  );
}

/** 球員：僅顯示大比分與本人數據（註解：不含球隊／全隊個人表）。 */
export function MatchResultReadonly({ data, teamName, currentMemberId }: Props) {
  const myRow = data.playerStats.find((p) => p.memberId === currentMemberId);
  const myStats = myRow?.stats;
  const hasPersonalStats = myStats && STAT_CATEGORIES.some((c) => hasCategoryData(myStats, c));

  return (
    <div className="space-y-6">
      <MatchResultVisualization data={data} teamName={teamName} scoreOnly />

      {hasPersonalStats ?
        <section className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">我的數據</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {STAT_CATEGORIES.map((c) => (
              <PersonalStatCard key={c} category={c} stats={myStats} />
            ))}
          </div>
        </section>
      : (
        <p className="text-sm text-slate-500 dark:text-slate-400">教練尚未登錄你的個人數據。</p>
      )}
    </div>
  );
}
