import Link from "next/link";

import {
  EventDuplicateButton,
} from "@/components/event-duplicate-actions";
import {
  EventStatusIndicator,
} from "@/components/domain-status-indicators";
import {
  eventTypeLabelShort,
  formatEventEndedListCompact,
  formatEventListTimeCompact,
} from "@/lib/event-display";
import { isEventEnded } from "@/lib/event-timing";
import type { EventStatus, EventType } from "@/generated/prisma/client";

export type CoachEventListRow = {
  id: string;
  title: string;
  type: EventType;
  status: EventStatus;
  startsAt: Date;
  endsAt: Date;
  locationName: string | null;
};

/** 教練事件列表 — 手機卡片（註解：收起「開始／人數」獨立欄，時間併入副標）。 */
export function CoachEventsListMobile({
  events,
  emptyMessage,
}: {
  events: CoachEventListRow[];
  emptyMessage: string;
}) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white px-4 py-12 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 md:hidden">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-zinc-100 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
      {events.map((ev) => {
        const ended = isEventEnded(ev.endsAt);
        const timeLabel = ended ? formatEventEndedListCompact(ev.startsAt) : formatEventListTimeCompact(ev.startsAt);
        const metaParts = [eventTypeLabelShort(ev.type), timeLabel];
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
                <EventDuplicateButton
                  eventId={ev.id}
                  label="複製"
                  className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
