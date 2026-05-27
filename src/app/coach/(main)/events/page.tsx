import Link from "next/link";

import { parseGroupConfig } from "@/lib/group-config";
import { CoachEventsListFilters } from "@/app/coach/(main)/events/events-list-filters";
import {
  buildCoachEventsListWhere,
  coachEventsFiltersToFormValues,
  hasActiveCoachEventsFilters,
  parseCoachEventsListFilters,
} from "@/app/coach/(main)/events/events-list-params";
import { getDebugTeamMember } from "@/lib/debug-session";
import { getPrisma } from "@/lib/prisma";
import { EventStatus, EventType } from "@/generated/prisma/client";
import {
  EventStatusIndicator,
  EventStatusLegend,
} from "@/components/domain-status-indicators";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { EventTitleInlineMeta } from "@/components/event-title-with-meta";
import { isEventEnded } from "@/lib/event-timing";
import { formatDateTimeZh } from "@/lib/format-datetime";

function typeLabel(t: EventType) {
  switch (t) {
    case EventType.TRAINING:
      return "訓練";
    case EventType.MATCH:
      return "比賽";
    default:
      return "其他";
  }
}

type PageProps = {
  searchParams: Promise<{
    q?: string;
    from?: string;
    to?: string;
    etype?: string | string[];
    estatus?: string | string[];
    squad?: string;
  }>;
};

const LIST_TAKE = 500;

/** 事件列表：搜尋（標題／地點）、日期區間、進階篩選（類型／狀態／分組）（註解：對應規格 A3）。 */
export default async function CoachEventsPage({ searchParams }: PageProps) {
  const member = await getDebugTeamMember();
  if (!member) return null;

  const sp = await searchParams;
  const parsed = parseCoachEventsListFilters(sp);
  const where = buildCoachEventsListWhere(parsed, member.teamId);
  const filterActive = hasActiveCoachEventsFilters(parsed);

  const prisma = getPrisma();
  const [events, team] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy: { startsAt: "desc" },
      include: {
        _count: { select: { participants: true } },
      },
      take: LIST_TAKE,
    }),
    prisma.team.findUnique({
      where: { id: member.teamId },
      select: { groupConfig: true },
    }),
  ]);

  const squads = parseGroupConfig(team?.groupConfig ?? null);
  const formValues = coachEventsFiltersToFormValues(parsed);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">事件</h1>
            {filterActive ?
              <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-200">
                已套用篩選
              </span>
            : null}
            <HintExclamationToggle>依開始時間排序（最新在上）。</HintExclamationToggle>
          </div>
        </div>
        <Link
          href="/coach/events/new"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          新增事件
        </Link>
      </div>

      <CoachEventsListFilters values={formValues} squads={squads} hasActiveFilters={filterActive} />

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        共 {events.length} 筆{events.length >= LIST_TAKE ? `（最多顯示 ${LIST_TAKE} 筆，請縮小篩選範圍）` : ""}
      </p>

      <EventStatusLegend />

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">標題</th>
              <th className="px-4 py-3 font-medium">類型</th>
              <th className="px-4 py-3 font-medium">開始</th>
              <th className="px-4 py-3 text-center font-medium">狀態</th>
              <th className="px-4 py-3 font-medium">人數</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {events.length === 0 ?
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-500 dark:text-zinc-400">
                  {filterActive ? "沒有符合條件的事件，請調整篩選或重設" : "尚無事件，請新增一場訓練或比賽"}
                </td>
              </tr>
            : events.map((ev) => {
                const ended = isEventEnded(ev.endsAt);
                return (
                <tr key={ev.id} className="hover:bg-zinc-50 dark:bg-zinc-950/80">
                  <td className="px-4 py-3">
                    <Link href={`/coach/events/${ev.id}`} className="text-blue-600 hover:underline">
                      <EventTitleInlineMeta
                        title={ev.title}
                        startsAt={ev.startsAt}
                        endsAt={ev.endsAt}
                        locationName={ev.locationName}
                        ended={ended}
                        titleClassName="font-medium text-blue-600"
                      />
                    </Link>
                    {!ended && ev.locationName ?
                      <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{ev.locationName}</span>
                    : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{typeLabel(ev.type)}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                    {ended ?
                      <span className="text-zinc-400">—</span>
                    : formatDateTimeZh(ev.startsAt, {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <EventStatusIndicator status={ev.status} />
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">{ev._count.participants}</td>
                </tr>
              );})
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
