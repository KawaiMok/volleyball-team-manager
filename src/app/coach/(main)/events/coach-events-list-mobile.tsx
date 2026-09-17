"use client";

import Link from "next/link";

import {
  coachEventTypeLabelShort,
  formatCoachEventEndedListCompact,
  formatCoachEventListTimeCompact,
  type CoachEventListRow,
} from "@/app/coach/(main)/events/coach-events-list-types";
import { EventStatusIndicator } from "@/components/domain-status-indicators";
import { isEventEnded } from "@/lib/event-timing";

export type { CoachEventListRow } from "@/app/coach/(main)/events/coach-events-list-types";

/** 教練事件列表 — 卡片列（註解：可於 BottomSheet 內全寬顯示）。 */
export function CoachEventsListMobile({
  events,
  emptyMessage,
  alwaysVisible = false,
}: {
  events: CoachEventListRow[];
  emptyMessage: string;
  /** 在 BottomSheet 內顯示時為 true（註解：略過 md:hidden）。 */
  alwaysVisible?: boolean;
}) {
  const visibility = alwaysVisible ? "" : "md:hidden";

  if (events.length === 0) {
    return (
      <p
        className={`rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 ${visibility}`}
      >
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul
      className={`divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 ${visibility}`}
    >
      {events.map((ev) => {
        const ended = isEventEnded(new Date(ev.endsAt));
        const startsAt = new Date(ev.startsAt);
        const timeLabel =
          ended ? formatCoachEventEndedListCompact(startsAt) : formatCoachEventListTimeCompact(startsAt);
        const metaParts = [coachEventTypeLabelShort(ev.type), timeLabel];
        if (!ended && ev.locationName?.trim()) {
          metaParts.push(ev.locationName.trim());
        }

        return (
          <li key={ev.id}>
            <div className="flex items-start gap-2 px-3 py-3">
              <Link href={`/coach/events/${ev.id}`} className="min-w-0 flex-1 active:opacity-80">
                <p className="font-medium leading-snug text-zinc-900 dark:text-zinc-50">{ev.title}</p>
                <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{metaParts.join(" · ")}</p>
              </Link>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <EventStatusIndicator status={ev.status} />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
