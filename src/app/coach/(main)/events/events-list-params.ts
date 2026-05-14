import { EventStatus, EventType, Prisma } from "@/generated/prisma/client";

import { startOfDay, toYmd } from "@/app/coach/(main)/calendar/calendar-utils";

/** 將 Next 查詢參數正規化為字串陣列（註解：支援 `etype=a&etype=b`）。 */
export function searchParamToStrings(v: string | string[] | undefined): string[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** 解析可選 YYYY-MM-DD；無效則回 null（註解：與行事曆 `parseYmd` 分離，避免預設今天誤判）。 */
export function parseYmdOptional(s: string | undefined): Date | null {
  if (!s || !YMD.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  return startOfDay(new Date(y, m - 1, d));
}

export function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

const EVENT_TYPES = new Set<string>(Object.values(EventType));
const EVENT_STATUSES = new Set<string>(Object.values(EventStatus));

export function parseEventTypesFromParams(raw: string | string[] | undefined): EventType[] {
  const out: EventType[] = [];
  for (const x of searchParamToStrings(raw)) {
    if (EVENT_TYPES.has(x)) out.push(x as EventType);
  }
  return [...new Set(out)];
}

export function parseEventStatusesFromParams(raw: string | string[] | undefined): EventStatus[] {
  const out: EventStatus[] = [];
  for (const x of searchParamToStrings(raw)) {
    if (EVENT_STATUSES.has(x)) out.push(x as EventStatus);
  }
  return [...new Set(out)];
}

export type CoachEventsListParsedFilters = {
  q: string;
  from: Date | null;
  to: Date | null;
  types: EventType[];
  statuses: EventStatus[];
  squad: string;
};

export function parseCoachEventsListFilters(sp: {
  q?: string;
  from?: string;
  to?: string;
  etype?: string | string[];
  estatus?: string | string[];
  squad?: string;
}): CoachEventsListParsedFilters {
  const q = (sp.q ?? "").trim();
  let from = parseYmdOptional(sp.from);
  let to = parseYmdOptional(sp.to);
  if (from && to && from.getTime() > to.getTime()) {
    const t = from;
    from = to;
    to = t;
  }
  const types = parseEventTypesFromParams(sp.etype);
  const statuses = parseEventStatusesFromParams(sp.estatus);
  const squad = (sp.squad ?? "").trim();
  return { q, from, to, types, statuses, squad };
}

export function coachEventsFiltersToFormValues(parsed: CoachEventsListParsedFilters): {
  q: string;
  fromYmd: string;
  toYmd: string;
  types: EventType[];
  statuses: EventStatus[];
  squad: string;
} {
  return {
    q: parsed.q,
    fromYmd: parsed.from ? toYmd(parsed.from) : "",
    toYmd: parsed.to ? toYmd(parsed.to) : "",
    types: parsed.types,
    statuses: parsed.statuses,
    squad: parsed.squad,
  };
}

/** 組 Prisma where（註解：標題／地點為 OR，其餘欄位與之以 AND 組合）。 */
export function buildCoachEventsListWhere(
  parsed: CoachEventsListParsedFilters,
  teamId: string,
): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = { teamId };

  if (parsed.q) {
    where.OR = [
      { title: { contains: parsed.q, mode: "insensitive" } },
      { locationName: { contains: parsed.q, mode: "insensitive" } },
    ];
  }

  const startsAt: Prisma.DateTimeFilter = {};
  if (parsed.from) startsAt.gte = parsed.from;
  if (parsed.to) startsAt.lte = endOfLocalDay(parsed.to);
  if (Object.keys(startsAt).length > 0) {
    where.startsAt = startsAt;
  }

  if (parsed.types.length > 0) {
    where.type = { in: parsed.types };
  }
  if (parsed.statuses.length > 0) {
    where.status = { in: parsed.statuses };
  }
  if (parsed.squad) {
    where.participants = {
      some: { member: { squad: parsed.squad } },
    };
  }

  return where;
}

export function hasActiveCoachEventsFilters(parsed: CoachEventsListParsedFilters): boolean {
  return Boolean(
    parsed.q ||
      parsed.from ||
      parsed.to ||
      parsed.types.length ||
      parsed.statuses.length ||
      parsed.squad,
  );
}
