"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";

import { AddTeamMemberForm } from "@/app/coach/(main)/team/add-member-form";
import { TeamRosterSection, type TeamRosterRow } from "@/app/coach/(main)/team/team-roster-section";
import { TeamMemberStatusLegend } from "@/components/domain-status-indicators";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { ServiceHubEntry, ServiceHubGrid } from "@/components/service-hub-entry";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { mapTeamMemberToRosterRow } from "@/lib/team-roster-map";

type PanelId = "settings" | "attendance" | "roster";

const ICON = {
  stats: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" d="M4 19V5M10 19V9M16 19V13M22 19V3" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  ),
  attendance: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" d="M9 11l3 3L22 4" />
      <path strokeLinecap="round" d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
  roster: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path strokeLinecap="round" d="M4 19c0-2.5 2.2-4 5-4s5 1.5 5 4M14 19c0-2 1.6-3.5 3.5-3.5" />
    </svg>
  ),
} as const;

type Props = {
  initialRows: TeamRosterRow[];
  squads: string[];
  positionOptions: readonly string[];
  currentMemberId: string;
  actorIsAdmin: boolean;
  settingsPanel: ReactNode;
  attendancePanel: ReactNode;
};

/** 教練隊伍頁：logo 入口 + BottomSheet（註解：對齊總覽儀表板風格）。 */
export function CoachTeamPageView({
  initialRows,
  squads,
  positionOptions,
  currentMemberId,
  actorIsAdmin,
  settingsPanel,
  attendancePanel,
}: Props) {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);
  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const onMemberAdded = useCallback((apiRow: unknown) => {
    const mapped = mapTeamMemberToRosterRow(apiRow as Parameters<typeof mapTeamMemberToRosterRow>[0]);
    setRows((prev) => {
      const without = prev.filter((r) => r.id !== mapped.id);
      return [...without, mapped].sort((a, b) => {
        const roleCmp = a.role.localeCompare(b.role);
        if (roleCmp !== 0) return roleCmp;
        return (a.displayName ?? a.email ?? "").localeCompare(b.displayName ?? b.email ?? "");
      });
    });
  }, []);

  const activeCount = rows.filter((r) => r.status === "ACTIVE").length;

  return (
    <>
      <ServiceHubGrid>
        <ServiceHubEntry label="隊伍統計" href="/coach/team/stats" icon={ICON.stats} />
        <ServiceHubEntry label="隊伍設定" icon={ICON.settings} onClick={() => setActivePanel("settings")} />
        <ServiceHubEntry label="出席率" icon={ICON.attendance} onClick={() => setActivePanel("attendance")} />
        <ServiceHubEntry
          label="隊員名單"
          badge={activeCount}
          icon={ICON.roster}
          onClick={() => setActivePanel("roster")}
        />
      </ServiceHubGrid>

      <BottomSheet
        open={activePanel === "settings"}
        onClose={() => setActivePanel(null)}
        title="隊伍設定"
        tall
        footer={
          <button
            type="button"
            onClick={() => setActivePanel(null)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
          >
            關閉
          </button>
        }
      >
        <div className="mb-3">
          <HintExclamationToggle>隊名、賽季與分組會影響標題列與行事曆／事件篩選。</HintExclamationToggle>
        </div>
        {settingsPanel}
      </BottomSheet>

      <BottomSheet
        open={activePanel === "attendance"}
        onClose={() => setActivePanel(null)}
        title="出席率統計"
        tall
        footer={
          <button
            type="button"
            onClick={() => setActivePanel(null)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
          >
            關閉
          </button>
        }
      >
        {attendancePanel}
      </BottomSheet>

      <BottomSheet
        open={activePanel === "roster"}
        onClose={() => setActivePanel(null)}
        title="隊員名單"
        tall
        footer={
          <button
            type="button"
            onClick={() => setActivePanel(null)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
          >
            關閉
          </button>
        }
      >
        <div className="space-y-6">
          <section>
            <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">新增隊員／隊務</h3>
            <AddTeamMemberForm
              squads={squads}
              positionOptions={positionOptions}
              actorIsAdmin={actorIsAdmin}
              onMemberAdded={onMemberAdded}
            />
          </section>
          <section>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">目前名單</h3>
              <HintExclamationToggle>
                主表僅顯示姓名、角色、背號、狀態；「詳情」可檢視聯絡方式與備註，「編輯」開大視窗修改。
              </HintExclamationToggle>
            </div>
            <TeamMemberStatusLegend />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 md:hidden">
              表格較寬時，可左右滑動查看「操作」欄
            </p>
            <div className="mt-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <TeamRosterSection
                squads={squads}
                positionOptions={positionOptions}
                currentMemberId={currentMemberId}
                rows={rows}
                actorIsAdmin={actorIsAdmin}
              />
            </div>
          </section>
        </div>
      </BottomSheet>
    </>
  );
}
