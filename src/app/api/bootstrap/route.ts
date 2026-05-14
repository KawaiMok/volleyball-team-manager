import { MemberStatus, TeamRole } from "@/generated/prisma/client";
import { isBootstrapAccessEnabled } from "@/lib/bootstrap-access";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * 本機／開發用：建立範例隊伍與兩位使用者（註解：正式環境見 `isBootstrapAccessEnabled`）。
 */
export async function POST() {
  if (!isBootstrapAccessEnabled()) {
    return NextResponse.json({ error: "Bootstrap 未開放（正式環境已關閉）" }, { status: 403 });
  }

  const prisma = getPrisma();
  const team = await prisma.team.create({
    data: {
      name: "示範排球隊",
      season: "2026",
      groupConfig: ["A", "B"],
    },
  });

  const coachUser = await prisma.user.create({
    data: { email: "coach@example.com", name: "示範教練" },
  });
  const playerUser = await prisma.user.create({
    data: { email: "player@example.com", name: "示範球員" },
  });

  const coachMember = await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: coachUser.id,
      role: TeamRole.COACH,
      status: MemberStatus.ACTIVE,
      jerseyNumber: 1,
      squad: "A",
    },
  });

  const playerMember = await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: playerUser.id,
      role: TeamRole.PLAYER,
      status: MemberStatus.ACTIVE,
      jerseyNumber: 7,
      squad: "A",
    },
  });

  return NextResponse.json({
    teamId: team.id,
    coach: { userId: coachUser.id, memberId: coachMember.id },
    player: { userId: playerUser.id, memberId: playerMember.id },
    hint: "請在 API 請求 header 帶 x-debug-team-id 與 x-debug-user-id",
  });
}
