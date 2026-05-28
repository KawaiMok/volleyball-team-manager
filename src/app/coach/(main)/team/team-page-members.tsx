"use client";

import { useCallback, useEffect, useState } from "react";

import { AddTeamMemberForm } from "@/app/coach/(main)/team/add-member-form";
import { TeamRosterSection, type TeamRosterRow } from "@/app/coach/(main)/team/team-roster-section";
import { TeamMemberStatusLegend } from "@/components/domain-status-indicators";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { CoachEventDetailCollapsibleSection } from "@/components/coach-event-detail-collapsible-section";
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
      <CoachEventDetailCollapsibleSection id="coach-team-add-member" title="新增隊員／隊務" defaultOpen={false}>
        <AddTeamMemberForm squads={squads} actorIsAdmin={actorIsAdmin} onMemberAdded={onMemberAdded} />
      </CoachEventDetailCollapsibleSection>

      <CoachEventDetailCollapsibleSection
        id="coach-team-roster"
        title="目前名單"
        defaultOpen={false}
        titleExtra={
          <HintExclamationToggle>
            主表僅顯示姓名、角色、背號、狀態；「詳情」可檢視聯絡方式與備註，「編輯」開大視窗修改。手機面板由下往上，可按 ×、背景或 Esc 關閉。
          </HintExclamationToggle>
        }
      >
        <TeamMemberStatusLegend />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 md:hidden">
          表格較寬時，可左右滑動查看「操作」欄
        </p>
        <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <TeamRosterSection
            squads={squads}
            currentMemberId={currentMemberId}
            rows={rows}
            actorIsAdmin={actorIsAdmin}
          />
        </div>
      </CoachEventDetailCollapsibleSection>
    </>
  );
}
