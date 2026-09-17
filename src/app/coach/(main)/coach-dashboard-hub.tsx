"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import {
  useCoachDashboardPrefs,
  type CoachDashboardWidgetId,
} from "@/app/coach/(main)/coach-dashboard-prefs";
import { ServiceHubEntry, ServiceHubGrid } from "@/components/service-hub-entry";
import { BottomSheet } from "@/components/ui/bottom-sheet";

type HubEntry = {
  id: CoachDashboardWidgetId;
  label: string;
  badge?: number;
  icon: ReactNode;
};

const ENTRY_META: Record<
  CoachDashboardWidgetId,
  { label: string; sheetTitle: string; icon: ReactNode; directHref?: string }
> = {
  stats: {
    label: "隊伍概況",
    sheetTitle: "隊伍概況",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" d="M4 19V5M10 19V9M16 19V13M22 19V3" />
      </svg>
    ),
  },
  todayTraining: {
    label: "今日訓練",
    sheetTitle: "今日訓練 · 身體回饋",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l3 2" />
      </svg>
    ),
  },
  upcoming: {
    label: "未來 7 天",
    sheetTitle: "未來 7 天行程",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
      </svg>
    ),
  },
  recentEvents: {
    label: "最近事件",
    sheetTitle: "最近事件",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" d="M12 8v5l3 1" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  roster: {
    label: "隊員名單",
    sheetTitle: "隊員名單",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path strokeLinecap="round" d="M4 19c0-2.5 2.2-4 5-4s5 1.5 5 4M14 19c0-2 1.6-3.5 3.5-3.5" />
      </svg>
    ),
  },
  fitnessAnalysis: {
    label: "體能分析",
    sheetTitle: "體能分析",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" d="M4 18h4l3-8 4 12 3-6h4" />
      </svg>
    ),
  },
  fitnessTrainingAdvice: {
    label: "體能訓練建議",
    sheetTitle: "體能訓練建議",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path strokeLinecap="round" d="M8 9h8M8 13h5" />
      </svg>
    ),
  },
  rsvp: {
    label: "出席追蹤",
    sheetTitle: "出席意願待追蹤",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9z" />
        <path strokeLinecap="round" d="M13.7 21a2 2 0 01-3.4 0" />
      </svg>
    ),
  },
  trends: {
    label: "RPE 趨勢",
    sheetTitle: "近 30 天 RPE 趨勢",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path strokeLinecap="round" d="M4 18l4-6 4 3 5-8 3 5" />
        <path strokeLinecap="round" d="M4 20h16" />
      </svg>
    ),
  },
  liveTactical: {
    label: "即時戰術",
    sheetTitle: "即時戰術版",
    directHref: "/coach/live-tactical",
    icon: (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="16" cy="8" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none" />
        <path strokeLinecap="round" d="M8 8l4 8M16 8l-4 8" />
      </svg>
    ),
  },
};

type SectionMap = Partial<Record<CoachDashboardWidgetId, ReactNode>>;

type Props = {
  badges: Partial<Record<CoachDashboardWidgetId, number>>;
  sections: SectionMap;
  hideWhenEmpty?: CoachDashboardWidgetId[];
  /** 依運動能力隱藏入口（註解：不支援的運動不顯示）。 */
  hiddenWidgets?: CoachDashboardWidgetId[];
};

/** 教練總覽：服務入口網格，點入 BottomSheet 再操作。 */
export function CoachDashboardHub({
  badges,
  sections,
  hideWhenEmpty = ["rsvp"],
  hiddenWidgets = [],
}: Props) {
  const { prefs } = useCoachDashboardPrefs();
  const [activeId, setActiveId] = useState<CoachDashboardWidgetId | null>(null);

  const hidden = new Set(hiddenWidgets);

  const entries: HubEntry[] = (Object.keys(ENTRY_META) as CoachDashboardWidgetId[])
    .filter((id) => !hidden.has(id))
    .filter((id) => prefs[id])
    .filter((id) => {
      if (!hideWhenEmpty.includes(id)) return true;
      return (badges[id] ?? 0) > 0;
    })
    .map((id) => ({
      id,
      label: ENTRY_META[id].label,
      badge: badges[id],
      icon: ENTRY_META[id].icon,
    }));

  const activeMeta = activeId ? ENTRY_META[activeId] : null;

  return (
    <>
      <ServiceHubGrid>
        {entries.map((e) => {
          const directHref = ENTRY_META[e.id].directHref;
          return (
            <ServiceHubEntry
              key={e.id}
              label={e.label}
              badge={e.badge}
              icon={e.icon}
              href={directHref}
              onClick={directHref ? undefined : () => setActiveId(e.id)}
            />
          );
        })}
      </ServiceHubGrid>

      {entries.length === 0 ?
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          請在上方「儀表板配置」勾選要顯示的入口。
        </p>
      : null}

      <BottomSheet
        open={activeId != null}
        onClose={() => setActiveId(null)}
        title={activeMeta?.sheetTitle ?? ""}
        tall={
          activeId === "roster" ||
          activeId === "fitnessAnalysis" ||
          activeId === "fitnessTrainingAdvice" ||
          activeId === "trends" ||
          activeId === "upcoming"
        }
        footer={
          <button
            type="button"
            onClick={() => setActiveId(null)}
            className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:text-zinc-200"
          >
            關閉
          </button>
        }
      >
        {activeId ? sections[activeId] : null}
      </BottomSheet>
    </>
  );
}
