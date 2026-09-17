import type { TeamRosterRow } from "@/app/coach/(main)/team/team-roster-section";

/** API／Prisma 成員列 → 名單 UI 列（註解：POST/GET `/api/team/members` 與頁面初始資料共用）。 */
export function mapTeamMemberToRosterRow(row: {
  id: string;
  updatedAt: string | Date;
  role: string;
  status: string;
  jerseyNumber: number | null;
  position: string | null;
  squad: string | null;
  phone: string | null;
  notes: string | null;
  birthDate?: string | Date | null;
  user: {
    email: string | null;
    name: string | null;
    clerkUserId: string | null;
  };
}): TeamRosterRow {
  const birthDateRaw = row.birthDate;
  const birthDateIso =
    birthDateRaw == null ? null
    : typeof birthDateRaw === "string" ? birthDateRaw.slice(0, 10)
    : birthDateRaw.toISOString().slice(0, 10);

  return {
    id: row.id,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : row.updatedAt.toISOString(),
    displayName: row.user.name,
    email: row.user.email,
    clerkLinked: Boolean(row.user.clerkUserId),
    role: row.role,
    status: row.status,
    jerseyNumber: row.jerseyNumber,
    position: row.position,
    squad: row.squad,
    phone: row.phone,
    notes: row.notes,
    birthDate: birthDateIso,
  };
}
