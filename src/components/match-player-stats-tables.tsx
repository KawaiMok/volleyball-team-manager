"use client";

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

export type PlayerStatsRow = {
  memberId: string;
  displayName: string;
  stats: PlayerMatchStats;
};

type Props = {
  playerStats: PlayerStatsRow[];
  /** 高亮當前球員列（註解：球員端唯讀）。 */
  highlightMemberId?: string;
};

/** 固定欄寬表格（註解：表頭與資料欄對齊）。 */
const TABLE_CLASS = "w-full table-fixed text-sm";

function StatTable({
  colCount,
  header,
  children,
}: {
  colCount: number;
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className={TABLE_CLASS}>
        <colgroup>
          <col className="w-[7rem]" />
          {Array.from({ length: colCount }, (_, i) => (
            <col key={i} />
          ))}
        </colgroup>
        <thead className="bg-zinc-50 text-xs text-zinc-500 dark:bg-zinc-950">{header}</thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-1 py-2 font-medium whitespace-nowrap ${className}`}>{children}</th>
  );
}

function Td({
  children,
  className = "",
  highlight,
}: {
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <td
      className={`px-1 py-1.5 align-middle tabular-nums ${highlight ? "bg-[var(--brand-primary)]/10 font-semibold" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

function CategoryTable({
  category,
  rows,
  highlightMemberId,
}: {
  category: StatCategory;
  rows: PlayerStatsRow[];
  highlightMemberId?: string;
}) {
  const filtered = rows.filter((r) => hasCategoryData(r.stats, category));
  if (filtered.length === 0) return null;

  const label = STAT_CATEGORY_LABELS[category];

  if (category === "attack") {
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</h4>
        <StatTable
          colCount={5}
          header={
            <tr>
              <Th className="px-2 text-left">球員</Th>
              <Th className="text-center">次數</Th>
              <Th className="text-center">得分</Th>
              <Th className="text-center">失誤</Th>
              <Th className="text-center">得分率%</Th>
              <Th className="text-center">失誤率%</Th>
            </tr>
          }
        >
          {filtered.map((r) => {
            const hl = r.memberId === highlightMemberId;
            const rates = computeAttackRates(r.stats);
            const a = r.stats.attack!;
            return (
              <tr key={r.memberId} className="border-t border-zinc-100 dark:border-zinc-800">
                <Td className="px-2 text-left" highlight={hl}>{r.displayName}</Td>
                <Td className="text-center" highlight={hl}>{a.attempts}</Td>
                <Td className="text-center" highlight={hl}>{a.points}</Td>
                <Td className="text-center" highlight={hl}>{a.errors}</Td>
                <Td className="text-center" highlight={hl}>{formatPct(rates.scoreRate)}</Td>
                <Td className="text-center" highlight={hl}>{formatPct(rates.errorRate)}</Td>
              </tr>
            );
          })}
        </StatTable>
      </div>
    );
  }

  if (category === "block") {
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</h4>
        <StatTable
          colCount={5}
          header={
            <tr>
              <Th className="px-2 text-left">球員</Th>
              <Th className="text-center">次數</Th>
              <Th className="text-center">有效</Th>
              <Th className="text-center">失誤</Th>
              <Th className="text-center">得分</Th>
              <Th className="text-center">攔網 rating</Th>
            </tr>
          }
        >
          {filtered.map((r) => {
            const hl = r.memberId === highlightMemberId;
            const b = r.stats.block!;
            return (
              <tr key={r.memberId} className="border-t border-zinc-100 dark:border-zinc-800">
                <Td className="px-2 text-left" highlight={hl}>{r.displayName}</Td>
                <Td className="text-center" highlight={hl}>{b.attempts}</Td>
                <Td className="text-center" highlight={hl}>{b.effective}</Td>
                <Td className="text-center" highlight={hl}>{b.errors}</Td>
                <Td className="text-center" highlight={hl}>{b.points}</Td>
                <Td className="text-center" highlight={hl}>{formatRating(computeBlockRating(r.stats))}</Td>
              </tr>
            );
          })}
        </StatTable>
      </div>
    );
  }

  if (category === "defense") {
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</h4>
        <StatTable
          colCount={4}
          header={
            <tr>
              <Th className="px-2 text-left">球員</Th>
              <Th className="text-center">次數</Th>
              <Th className="text-center">成功</Th>
              <Th className="text-center">失誤</Th>
              <Th className="text-center">有效防守%</Th>
            </tr>
          }
        >
          {filtered.map((r) => {
            const hl = r.memberId === highlightMemberId;
            const d = r.stats.defense!;
            return (
              <tr key={r.memberId} className="border-t border-zinc-100 dark:border-zinc-800">
                <Td className="px-2 text-left" highlight={hl}>{r.displayName}</Td>
                <Td className="text-center" highlight={hl}>{d.attempts}</Td>
                <Td className="text-center" highlight={hl}>{d.success}</Td>
                <Td className="text-center" highlight={hl}>{d.errors}</Td>
                <Td className="text-center" highlight={hl}>{formatPct(computeDefenseRate(r.stats))}</Td>
              </tr>
            );
          })}
        </StatTable>
      </div>
    );
  }

  if (category === "pass") {
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</h4>
        <StatTable
          colCount={5}
          header={
            <tr>
              <Th className="px-2 text-left">球員</Th>
              <Th className="text-center">A 完美</Th>
              <Th className="text-center">B 僅入3米</Th>
              <Th className="text-center">C 修正或更差</Th>
              <Th className="text-center">被 ACE</Th>
              <Th className="text-center">一傳 rating</Th>
            </tr>
          }
        >
          {filtered.map((r) => {
            const hl = r.memberId === highlightMemberId;
            const p = r.stats.pass!;
            return (
              <tr key={r.memberId} className="border-t border-zinc-100 dark:border-zinc-800">
                <Td className="px-2 text-left" highlight={hl}>{r.displayName}</Td>
                <Td className="text-center" highlight={hl}>{p.perfect}</Td>
                <Td className="text-center" highlight={hl}>{p.good}</Td>
                <Td className="text-center" highlight={hl}>{p.poor}</Td>
                <Td className="text-center" highlight={hl}>{p.aced}</Td>
                <Td className="text-center" highlight={hl}>{formatRating(computePassRating(r.stats))}</Td>
              </tr>
            );
          })}
        </StatTable>
      </div>
    );
  }

  if (category === "serve") {
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</h4>
        <StatTable
          colCount={6}
          header={
            <tr>
              <Th className="px-2 text-left">球員</Th>
              <Th className="text-center">A 強</Th>
              <Th className="text-center">B 一般</Th>
              <Th className="text-center">C 菜</Th>
              <Th className="text-center">失誤</Th>
              <Th className="text-center">ACE</Th>
              <Th className="text-center">發球 rating</Th>
            </tr>
          }
        >
          {filtered.map((r) => {
            const hl = r.memberId === highlightMemberId;
            const s = r.stats.serve!;
            return (
              <tr key={r.memberId} className="border-t border-zinc-100 dark:border-zinc-800">
                <Td className="px-2 text-left" highlight={hl}>{r.displayName}</Td>
                <Td className="text-center" highlight={hl}>{s.strong}</Td>
                <Td className="text-center" highlight={hl}>{s.normal}</Td>
                <Td className="text-center" highlight={hl}>{s.weak}</Td>
                <Td className="text-center" highlight={hl}>{s.errors}</Td>
                <Td className="text-center" highlight={hl}>{s.aces}</Td>
                <Td className="text-center" highlight={hl}>{formatRating(computeServeRating(r.stats))}</Td>
              </tr>
            );
          })}
        </StatTable>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</h4>
      <StatTable
        colCount={1}
        header={
          <tr>
            <Th className="px-2 text-left">球員</Th>
            <Th className="text-center">失誤</Th>
          </tr>
        }
      >
        {filtered.map((r) => {
          const hl = r.memberId === highlightMemberId;
          const o = r.stats.other!;
          return (
            <tr key={r.memberId} className="border-t border-zinc-100 dark:border-zinc-800">
              <Td className="px-2 text-left" highlight={hl}>{r.displayName}</Td>
              <Td className="text-center" highlight={hl}>{o.errors}</Td>
            </tr>
          );
        })}
      </StatTable>
    </div>
  );
}

/** 六大分類個人數據表格（註解：含衍生 rating/百分比）。 */
export function MatchPlayerStatsTables({ playerStats, highlightMemberId }: Props) {
  const hasAny = STAT_CATEGORIES.some((c) => playerStats.some((p) => hasCategoryData(p.stats, c)));
  if (!hasAny) return null;

  return (
    <div className="space-y-5">
      {STAT_CATEGORIES.map((c) => (
        <CategoryTable key={c} category={c} rows={playerStats} highlightMemberId={highlightMemberId} />
      ))}
    </div>
  );
}
