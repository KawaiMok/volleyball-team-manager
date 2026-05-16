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

function statusLabel(s: EventStatus) {
  switch (s) {
    case EventStatus.DRAFT:
      return "草稿";
    case EventStatus.PUBLISHED:
      return "已發布";
    case EventStatus.CANCELLED:
      return "已取消";
    default:
      return s;
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
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">事件</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            依開始時間排序（最新在上）
            {filterActive ?
              <span className="ml-2 text-blue-700">· 已套用篩選</span>
            : null}
          </p>
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

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">標題</th>
              <th className="px-4 py-3 font-medium">類型</th>
              <th className="px-4 py-3 font-medium">開始</th>
              <th className="px-4 py-3 font-medium">狀態</th>
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
            : events.map((ev) => (
                <tr key={ev.id} className="hover:bg-zinc-50 dark:bg-zinc-950/80">
                  <td className="px-4 py-3">
                    <Link href={`/coach/events/${ev.id}`} className="font-medium text-blue-600 hover:underline">
                      {ev.title}
                    </Link>
                    {ev.locationName ?
                      <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">{ev.locationName}</span>
                    : null}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{typeLabel(ev.type)}</td>
                  <td className="px-4 py-3 tabular-nums text-zinc-700 dark:text-zinc-300">
                    {ev.startsAt.toLocaleString("zh-TW", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        ev.status === EventStatus.DRAFT ?
                          "rounded bg-amber-100 px-2 py-0.5 text-amber-900"
                        : ev.status === EventStatus.PUBLISHED ?
                          "rounded bg-emerald-100 px-2 py-0.5 text-emerald-900"
                        : "rounded bg-zinc-200 px-2 py-0.5 text-zinc-800 dark:text-zinc-200"
                      }
                    >
                      {statusLabel(ev.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">{ev._count.participants}</td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
