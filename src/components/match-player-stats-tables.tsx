"use client";

import { useState } from "react";

import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useMatchModule } from "@/components/team-sport-provider";
import type { MatchResultPlayerRow, PlayerStatsRecord } from "@/lib/sports/match/types";

export type PlayerStatsRow = {
  memberId: string;
  displayName: string;
  stats: PlayerStatsRecord;
  /** 球員位置（註解：比較圖表篩選同位置用） */
  position?: string | null;
  squad?: string | null;
};

type Props = {
  playerStats: PlayerStatsRow[];
  highlightMemberId?: string;
};

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
    <div className="hidden overflow-x-auto rounded-lg border border-zinc-200 md:block dark:border-zinc-800">
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
  return <th className={`px-1 py-2 font-medium whitespace-nowrap ${className}`}>{children}</th>;
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

function categorySummary(stats: PlayerStatsRecord, category: string, match: ReturnType<typeof useMatchModule>): string {
  if (!match.hasCategoryData(stats, category)) return "尚未填寫";
  const cat = stats[category] as Record<string, number>;
  const fields = (match.categoryFields[category] ?? []).filter((f) => !f.derived).slice(0, 3);
  return fields.map((f) => `${f.label}${cat[f.key] ?? 0}`).join(" · ");
}

function PlayerStatViewSheet({ row, category }: { row: PlayerStatsRow; category: string }) {
  const match = useMatchModule();
  const fields = match.categoryFields[category] ?? [];
  const cat = row.stats[category] as Record<string, number> | undefined;

  return (
    <dl className="space-y-3">
      {fields.map((f) => (
        <div
          key={f.key}
          className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-950"
        >
          <dt className="text-sm text-zinc-600 dark:text-zinc-400">{f.label}</dt>
          <dd className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {f.derived ? match.derivedStatValue(row.stats, f.derived) : (cat?.[f.key] ?? 0)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function CategoryTable({
  category,
  rows,
  highlightMemberId,
  onMobileSelect,
}: {
  category: string;
  rows: PlayerStatsRow[];
  highlightMemberId?: string;
  onMobileSelect: (row: PlayerStatsRow, category: string) => void;
}) {
  const match = useMatchModule();
  const filtered = rows.filter((r) => match.hasCategoryData(r.stats, category));
  if (filtered.length === 0) return null;

  const label = match.categoryLabels[category] ?? category;
  const fields = match.categoryFields[category] ?? [];

  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">{label}</h4>
      <ul className="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 md:hidden dark:divide-zinc-800 dark:border-zinc-800">
        {filtered.map((r) => {
          const hl = r.memberId === highlightMemberId;
          return (
            <li key={r.memberId}>
              <button
                type="button"
                onClick={() => onMobileSelect(r, category)}
                className={`flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-zinc-50 active:bg-zinc-100 dark:hover:bg-zinc-900 dark:active:bg-zinc-800 ${hl ? "bg-[var(--brand-primary)]/5" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`font-medium ${hl ? "text-[var(--brand-primary)]" : "text-zinc-900 dark:text-zinc-50"}`}>
                    {r.displayName}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {categorySummary(r.stats, category, match)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-400">詳情</span>
              </button>
            </li>
          );
        })}
      </ul>
      <StatTable
        colCount={fields.length}
        header={
          <tr>
            <Th className="px-2 text-left">球員</Th>
            {fields.map((f) => (
              <Th key={f.key} className="text-center">
                {f.label}
              </Th>
            ))}
          </tr>
        }
      >
        {filtered.map((r) => {
          const hl = r.memberId === highlightMemberId;
          const cat = r.stats[category] as Record<string, number>;
          return (
            <tr key={r.memberId} className="border-t border-zinc-100 dark:border-zinc-800">
              <Td className="px-2 text-left" highlight={hl}>
                {r.displayName}
              </Td>
              {fields.map((f) => (
                <Td key={f.key} className="text-center" highlight={hl}>
                  {f.derived ? match.derivedStatValue(r.stats, f.derived) : (cat?.[f.key] ?? 0)}
                </Td>
              ))}
            </tr>
          );
        })}
      </StatTable>
    </div>
  );
}

/** 個人數據表格（註解：依運動模組動態分類）。 */
export function MatchPlayerStatsTables({ playerStats, highlightMemberId }: Props) {
  const match = useMatchModule();
  const [viewSheet, setViewSheet] = useState<{ row: PlayerStatsRow; category: string } | null>(null);
  const hasAny = match.categories.some((c) =>
    playerStats.some((p) => match.hasCategoryData(p.stats, c)),
  );
  if (!hasAny) return null;

  return (
    <>
      <div className="space-y-5">
        {match.categories.map((c) => (
          <CategoryTable
            key={c}
            category={c}
            rows={playerStats}
            highlightMemberId={highlightMemberId}
            onMobileSelect={(row, category) => setViewSheet({ row, category })}
          />
        ))}
      </div>

      <BottomSheet
        open={viewSheet !== null}
        onClose={() => setViewSheet(null)}
        title={viewSheet?.row.displayName ?? ""}
        subtitle={
          viewSheet ?
            `${match.categoryLabels[viewSheet.category]} · 個人數據`
          : undefined
        }
        footer={
          <button
            type="button"
            onClick={() => setViewSheet(null)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
          >
            關閉
          </button>
        }
      >
        {viewSheet ?
          <PlayerStatViewSheet row={viewSheet.row} category={viewSheet.category} />
        : null}
      </BottomSheet>
    </>
  );
}
