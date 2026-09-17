"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import {
  CoachEventsListMobile,
  type CoachEventListRow,
} from "@/app/coach/(main)/events/coach-events-list-mobile";
import {
  CoachEventsListFilters,
  type CoachEventsListFilterValues,
} from "@/app/coach/(main)/events/events-list-filters";
import { CopyLastTrainingHubEntry } from "@/components/event-duplicate-actions";
import { EventStatusLegend } from "@/components/domain-status-indicators";
import { ServiceHubEntry, ServiceHubGrid } from "@/components/service-hub-entry";
import { BottomSheet } from "@/components/ui/bottom-sheet";

type PanelId = "list" | "filters";

const ICON = {
  newEvent: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  filters: (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path strokeLinecap="round" d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  ),
} as const;

type Props = {
  events: CoachEventListRow[];
  filterValues: CoachEventsListFilterValues;
  squads: string[];
  filterActive: boolean;
  listTake: number;
  emptyMessage: string;
  calendar: ReactNode;
  calYmd: string;
};

/** 教練事件列表：左側 logo 入口 + 右側月曆（註解：列表／篩選在 BottomSheet）。 */
export function CoachEventsPageView({
  events,
  filterValues,
  squads,
  filterActive,
  listTake,
  emptyMessage,
  calendar,
  calYmd,
}: Props) {
  const [activePanel, setActivePanel] = useState<PanelId | null>(null);

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(10rem,15rem)_1fr] xl:grid-cols-[minmax(11rem,16rem)_1fr]">
        <aside className="min-w-0">
          <ServiceHubGrid className="grid grid-cols-2 gap-3">
            <ServiceHubEntry label="新增事件" href="/coach/events/new" icon={ICON.newEvent} />
            <ServiceHubEntry
              label="全部列表"
              badge={events.length}
              icon={ICON.list}
              onClick={() => setActivePanel("list")}
            />
            <ServiceHubEntry
              label="搜尋篩選"
              badge={filterActive ? 1 : undefined}
              icon={ICON.filters}
              onClick={() => setActivePanel("filters")}
            />
            <CopyLastTrainingHubEntry />
          </ServiceHubGrid>
        </aside>

        <div className="min-w-0">{calendar}</div>
      </div>

      <BottomSheet
        open={activePanel === "list"}
        onClose={() => setActivePanel(null)}
        title="全部事件"
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
        <div className="space-y-4">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            共 {events.length} 筆
            {events.length >= listTake ? `（最多顯示 ${listTake} 筆，請縮小篩選範圍）` : ""}
            · 依開始時間排序（最新在上）
          </p>
          <EventStatusLegend />
          <CoachEventsListMobile events={events} emptyMessage={emptyMessage} alwaysVisible />
        </div>
      </BottomSheet>

      <BottomSheet
        open={activePanel === "filters"}
        onClose={() => setActivePanel(null)}
        title="搜尋與篩選"
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
        <CoachEventsListFilters
          values={filterValues}
          squads={squads}
          hasActiveFilters={filterActive}
          calYmd={calYmd}
        />
      </BottomSheet>
    </>
  );
}
