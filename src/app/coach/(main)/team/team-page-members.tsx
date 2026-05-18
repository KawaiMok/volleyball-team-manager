"use client";

import { useCallback, useEffect, useState } from "react";

import { AddTeamMemberForm } from "@/app/coach/(main)/team/add-member-form";
import { TeamRosterSection, type TeamRosterRow } from "@/app/coach/(main)/team/team-roster-section";
import { TeamMemberStatusLegend } from "@/components/domain-status-indicators";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { mapTeamMemberToRosterRow } from "@/lib/team-roster-map";

type Props = {
  initialRows: TeamRosterRow[];
  squads: string[];
  currentMemberId: string;
  actorIsAdmin: boolean;
};

/** 新增隊員＋名單（註解：成功後立即更新 client 名單，不依賴 router.refresh 時序）。 */
export function TeamPageMembers({ initialRows, squads, currentMemberId, actorIsAdmin }: Props) {
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const onMemberAdded = useCallback((apiRow: unknown) => {
    const mapped = mapTeamMemberToRosterRow(
      apiRow as Parameters<typeof mapTeamMemberToRosterRow>[0],
    );
    setRows((prev) => {
      const without = prev.filter((r) => r.id !== mapped.id);
      return [...without, mapped].sort((a, b) => {
        const roleCmp = a.role.localeCompare(b.role);
        if (roleCmp !== 0) return roleCmp;
        return (a.displayName ?? a.email ?? "").localeCompare(b.displayName ?? b.email ?? "");
      });
    });
  }, []);

  return (
    <>
      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          新增隊員／隊務
        </h2>
        <div className="mt-4">
          <AddTeamMemberForm squads={squads} actorIsAdmin={actorIsAdmin} onMemberAdded={onMemberAdded} />
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              目前名單
            </h2>
            <HintExclamationToggle>
              主表僅顯示姓名、角色、背號、狀態；「詳情」可檢視聯絡方式與備註，「編輯」開大視窗修改。手機面板由下往上，可按 ×、背景或 Esc 關閉。
            </HintExclamationToggle>
          </div>
          <TeamMemberStatusLegend className="mt-2" />
        </div>
        <TeamRosterSection
          squads={squads}
          currentMemberId={currentMemberId}
          rows={rows}
          actorIsAdmin={actorIsAdmin}
        />
      </section>
    </>
  );
}
