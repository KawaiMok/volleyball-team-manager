/** 行事曆共用：本地日期與區間（註解：週一為一週起始）。 */

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseYmd(s: string | undefined): Date {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return startOfDay(new Date());
  }
  const [y, m, d] = s.split("-").map(Number);
  return startOfDay(new Date(y, m - 1, d));
}

export function startOfWeekMonday(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

/** Prisma 用：下週同一時刻（不含）。 */
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1, 0, 0, 0, 0);
}

export function endOfMonthExclusive(d: Date): Date {
  return addMonths(startOfMonth(d), 1);
}

export type CalendarView = "week" | "list" | "month";

export function parseView(v: string | undefined): CalendarView {
  if (v === "list" || v === "month") return v;
  return "week";
}
