import {
  computeTeamAttendanceStats,
  type AttendanceStatsPeriod,
} from "@/lib/attendance-stats";
import { getDebugTeamMember } from "@/lib/debug-session";
import { isCoachLike } from "@/lib/rbac";
import { NextResponse } from "next/server";

const PERIODS = new Set<AttendanceStatsPeriod>(["week", "month", "year"]);

/** 隊伍球員出席率（週／月／年）（註解：教練／管理員）。 */
export async function GET(req: Request) {
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  if (!isCoachLike(member)) {
    return NextResponse.json({ error: "需要教練或管理員權限" }, { status: 403 });
  }

  const url = new URL(req.url);
  const periodRaw = url.searchParams.get("period") ?? "month";
  const period = PERIODS.has(periodRaw as AttendanceStatsPeriod) ?
    (periodRaw as AttendanceStatsPeriod)
  : "month";
  const date = url.searchParams.get("date")?.trim() || undefined;

  const result = await computeTeamAttendanceStats(member.teamId, period, date);

  return NextResponse.json(result);
}
