import {
  addDays,
  addMonths,
  parseYmd,
  startOfMonth,
  startOfWeekMonday,
  toYmd,
} from "@/app/coach/(main)/calendar/calendar-utils";
import { EventStatus, MemberStatus } from "@/generated/prisma/client";
import { formatDateZh } from "@/lib/format-datetime";
import { getPrisma } from "@/lib/prisma";

export type AttendanceStatsPeriod = "week" | "month" | "year";

export type AttendancePeriodBounds = {
  period: AttendanceStatsPeriod;
  /** 區間起日 YYYY-MM-DD（含） */
  startYmd: string;
  /** 區間迄日 YYYY-MM-DD（不含，與 Prisma `lt` 對齊） */
  endExclusiveYmd: string;
  label: string;
  prevAnchorYmd: string;
  nextAnchorYmd: string;
};

export type MemberAttendanceStatRow = {
  memberId: string;
  displayName: string;
  squad: string | null;
  jerseyNumber: number | null;
  /** 應出席場次（已結束、已發布、且為參與者） */
  eligible: number;
  /** 教練點名實到 */
  attended: number;
  /** 0–100；無場次時為 null */
  ratePercent: number | null;
};

function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function addYears(d: Date, n: number): Date {
  return new Date(d.getFullYear() + n, 0, 1, 0, 0, 0, 0);
}

/** 依錨點日計算週／月／年統計區間（註解：週一為週起；區間標籤供 UI）。 */
export function getAttendancePeriodBounds(
  period: AttendanceStatsPeriod,
  anchorYmd?: string,
): AttendancePeriodBounds {
  const anchor = parseYmd(anchorYmd);

  if (period === "week") {
    const start = startOfWeekMonday(anchor);
    const endExcl = addDays(start, 7);
    const prev = addDays(start, -7);
    const next = addDays(start, 7);
    const endIncl = addDays(endExcl, -1);
    return {
      period,
      startYmd: toYmd(start),
      endExclusiveYmd: toYmd(endExcl),
      label: `${formatDateZh(start, { month: "numeric", day: "numeric" })} — ${formatDateZh(endIncl, {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      })}`,
      prevAnchorYmd: toYmd(prev),
      nextAnchorYmd: toYmd(next),
    };
  }

  if (period === "month") {
    const start = startOfMonth(anchor);
    const endExcl = addMonths(start, 1);
    const prev = addMonths(start, -1);
    const next = addMonths(start, 1);
    return {
      period,
      startYmd: toYmd(start),
      endExclusiveYmd: toYmd(endExcl),
      label: formatDateZh(start, { year: "numeric", month: "long" }),
      prevAnchorYmd: toYmd(prev),
      nextAnchorYmd: toYmd(next),
    };
  }

  const start = startOfYear(anchor);
  const endExcl = addYears(start, 1);
  const prev = addYears(start, -1);
  const next = addYears(start, 1);
  return {
    period,
    startYmd: toYmd(start),
    endExclusiveYmd: toYmd(endExcl),
    label: formatDateZh(start, { year: "numeric" }),
    prevAnchorYmd: toYmd(prev),
    nextAnchorYmd: toYmd(next),
  };
}

/**
 * 隊伍球員出席率（註解：分母＝區間內已結束且已發布、該員為參與者之場次；分子＝checkedIn）。
 */
export async function computeTeamAttendanceStats(
  teamId: string,
  period: AttendanceStatsPeriod,
  anchorYmd?: string,
): Promise<{ bounds: AttendancePeriodBounds; rows: MemberAttendanceStatRow[]; totalEvents: number }> {
  const bounds = getAttendancePeriodBounds(period, anchorYmd);
  const periodStart = parseYmd(bounds.startYmd);
  const periodEndExcl = parseYmd(bounds.endExclusiveYmd);
  const now = new Date();

  const prisma = getPrisma();

  const [members, events] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId, status: MemberStatus.ACTIVE },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    prisma.event.findMany({
      where: {
        teamId,
        status: EventStatus.PUBLISHED,
        endsAt: { gte: periodStart, lt: periodEndExcl },
      },
      select: {
        id: true,
        endsAt: true,
        participants: { select: { memberId: true } },
        attendance: { select: { memberId: true, checkedIn: true } },
      },
    }),
  ]);

  /** 僅統計已結束場次（註解：進行中場次不計入分母）。 */
  const endedEvents = events.filter((e) => e.endsAt.getTime() <= now.getTime());

  const tallies = new Map<string, { eligible: number; attended: number }>();
  for (const m of members) {
    tallies.set(m.id, { eligible: 0, attended: 0 });
  }

  for (const ev of endedEvents) {
    const participantIds = new Set(ev.participants.map((p) => p.memberId));
    const checkedInIds = new Set(ev.attendance.filter((a) => a.checkedIn).map((a) => a.memberId));

    for (const memberId of participantIds) {
      const t = tallies.get(memberId);
      if (!t) continue;
      t.eligible += 1;
      if (checkedInIds.has(memberId)) t.attended += 1;
    }
  }

  const rows: MemberAttendanceStatRow[] = members.map((m) => {
    const t = tallies.get(m.id) ?? { eligible: 0, attended: 0 };
    const ratePercent =
      t.eligible > 0 ? Math.round((t.attended / t.eligible) * 1000) / 10 : null;
    return {
      memberId: m.id,
      displayName: m.user.name ?? m.user.email ?? m.id.slice(0, 8),
      squad: m.squad,
      jerseyNumber: m.jerseyNumber,
      eligible: t.eligible,
      attended: t.attended,
      ratePercent,
    };
  });

  rows.sort((a, b) => {
    const ar = a.ratePercent ?? -1;
    const br = b.ratePercent ?? -1;
    if (br !== ar) return br - ar;
    return a.displayName.localeCompare(b.displayName, "zh-Hant");
  });

  return { bounds, rows, totalEvents: endedEvents.length };
}
