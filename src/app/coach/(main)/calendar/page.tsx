import {
  CoachCalendarListView,
  CoachCalendarMonthGrid,
  CoachCalendarWeekGrid,
  CoachCalendarWeekGridDesktop,
  type CalendarEventRow,
} from "@/app/coach/(main)/calendar/calendar-views";
import { CalendarToolbar } from "@/app/coach/(main)/calendar/calendar-toolbar";
import {
  addDays,
  endOfMonthExclusive,
  parseView,
  parseYmd,
  startOfWeekMonday,
  toYmd,
} from "@/app/coach/(main)/calendar/calendar-utils";
import { getDebugTeamMember } from "@/lib/debug-session";
import { parseGroupConfig } from "@/lib/group-config";
import { getPrisma } from "@/lib/prisma";
import { EventType, Prisma } from "@/generated/prisma/client";

type PageProps = {
  searchParams: Promise<{ view?: string; date?: string; type?: string; squad?: string }>;
};

/** 教練行事曆：週／列表／月 + 類型與分組篩選（註解：對應規格 A2）。 */
export default async function CoachCalendarPage({ searchParams }: PageProps) {
  const member = await getDebugTeamMember();
  if (!member) return null;

  const sp = await searchParams;
  const view = parseView(sp.view);
  const anchor = parseYmd(sp.date);
  const typeParam = sp.type ?? "ALL";
  const typeFilter =
    typeParam === "TRAINING" || typeParam === "MATCH" || typeParam === "OTHER" ? typeParam : "ALL";
  const squadFilter = (sp.squad ?? "").trim();

  const prisma = getPrisma();
  const team = await prisma.team.findUnique({
    where: { id: member.teamId },
    select: { groupConfig: true },
  });
  const squads = parseGroupConfig(team?.groupConfig ?? null);

  const weekStart = startOfWeekMonday(anchor);
  const weekEndExcl = addDays(weekStart, 7);
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 0, 0, 0, 0);
  const monthEndExcl = endOfMonthExclusive(anchor);

  const rangeStart = view === "month" ? monthStart : weekStart;
  const rangeEndExcl = view === "month" ? monthEndExcl : weekEndExcl;

  const where: Prisma.EventWhereInput = {
    teamId: member.teamId,
    startsAt: {
      gte: rangeStart,
      lt: rangeEndExcl,
    },
  };

  if (typeFilter !== "ALL") {
    where.type = typeFilter as EventType;
  }

  if (squadFilter) {
    where.participants = {
      some: {
        member: { squad: squadFilter },
      },
    };
  }

  const rawEvents = await prisma.event.findMany({
    where,
    orderBy: { startsAt: "asc" },
    take: view === "month" ? 500 : 200,
    select: {
      id: true,
      title: true,
      type: true,
      status: true,
      startsAt: true,
      endsAt: true,
    },
  });

  const events: CalendarEventRow[] = rawEvents;

  const dateYmd = toYmd(anchor);
  const weekLabel = `${weekStart.toLocaleDateString("zh-TW", { month: "numeric", day: "numeric" })} — ${addDays(weekStart, 6).toLocaleDateString("zh-TW", { month: "numeric", day: "numeric", year: "numeric" })}`;
  const monthLabel = anchor.toLocaleDateString("zh-TW", { year: "numeric", month: "long" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">行事曆</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">週／列表／月視圖；可依類型與分組篩選，點事件進入詳情</p>
      </div>

      <CalendarToolbar
        view={view}
        dateYmd={dateYmd}
        typeFilter={typeFilter}
        squadFilter={squadFilter}
        squads={squads}
        weekLabel={weekLabel}
        monthLabel={monthLabel}
      />

      {view === "month" ?
        <CoachCalendarMonthGrid monthAnchor={anchor} events={events} />
      : view === "list" ?
        <CoachCalendarListView events={events} />
      : (
        <>
          <CoachCalendarWeekGrid weekStart={weekStart} events={events} />
          <CoachCalendarWeekGridDesktop weekStart={weekStart} events={events} />
        </>
      )}
    </div>
  );
}
