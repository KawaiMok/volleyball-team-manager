import { EventType } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { canManageMatchResult } from "@/lib/match-result-access";
import { isPlayerReviewSubjectRole } from "@/lib/player-review-access";
import type { MatchResultBody } from "@/lib/sports/match/types";
import type { SportMatchClientModule } from "@/lib/sports/match/types";
import { sportFeatureUnavailableResponse } from "@/lib/sport-api-guard";
import { getPrisma } from "@/lib/prisma";
import { getSportMatchModule, prismaSportToId } from "@/lib/sports/registry-server";
import { getSportModule } from "@/lib/sports/registry";
import { getTeamSport } from "@/lib/team-sport";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

function serializeResult(
  row: {
    id: string;
    opponentName: string | null;
    sets: unknown;
    teamStats: unknown;
    notes: string | null;
    updatedAt: Date;
    playerStats: Array<{
      memberId: string;
      stats: unknown;
      member: { user: { name: string | null; email: string | null } | null };
    }>;
  },
  matchMod: SportMatchClientModule,
) {
  return {
    id: row.id,
    opponentName: row.opponentName,
    sets: row.sets,
    teamStats: (row.teamStats as Record<string, number | undefined> | null) ?? null,
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
    playerStats: row.playerStats.map((p) => ({
      memberId: p.memberId,
      displayName: p.member.user?.name ?? p.member.user?.email ?? p.memberId.slice(0, 8),
      stats: matchMod.normalizePlayerStats(p.stats),
    })),
  };
}

/** 教練：讀取比賽結果（註解：MATCH 事件）。 */
export async function GET(_req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
    select: { id: true, type: true },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  if (event.type !== EventType.MATCH) {
    return NextResponse.json({ error: "僅比賽事件可登錄結果" }, { status: 400 });
  }

  const sport = await getTeamSport(member.teamId);
  const matchMod = sport ? getSportMatchModule(sport) : null;

  const result = await prisma.matchResult.findUnique({
    where: { eventId },
    include: {
      playerStats: {
        include: { member: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { member: { jerseyNumber: "asc" } },
      },
    },
  });

  return NextResponse.json({
    result: result && matchMod ? serializeResult(result, matchMod) : null,
  });
}

/** 教練：儲存比賽結果（註解：事件結束後；upsert）。 */
export async function PUT(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
    select: { id: true, type: true, status: true, endsAt: true },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  if (!canManageMatchResult(member, event)) {
    return NextResponse.json({ error: "比賽結束後才可登錄結果" }, { status: 403 });
  }

  const sport = await getTeamSport(member.teamId);
  const sportMod = sport ? getSportModule(prismaSportToId(sport)) : null;
  const matchMod = sport ? getSportMatchModule(sport) : null;
  if (!sportMod?.capabilities.matchStats || !matchMod) {
    return sportFeatureUnavailableResponse("matchStats");
  }

  let body: MatchResultBody;
  try {
    body = matchMod.matchResultBodySchema.parse(await req.json()) as MatchResultBody;
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  /** 僅接受參與名單中的球員（註解：PLAYER／COACH_PLAYER）。 */
  const participants = await prisma.eventParticipant.findMany({
    where: { eventId },
    include: { member: { select: { id: true, role: true } } },
  });
  const allowedIds = new Set(
    participants.filter((p) => isPlayerReviewSubjectRole(p.member.role)).map((p) => p.memberId),
  );

  /** 只存有資料的球員列。 */
  const playerStatsToSave = body.playerStats.filter((ps) => {
    if (!allowedIds.has(ps.memberId)) return false;
    return matchMod.hasAnyPlayerStats(ps.stats);
  });

  for (const ps of body.playerStats) {
    if (!allowedIds.has(ps.memberId) && matchMod.hasAnyPlayerStats(ps.stats)) {
      return NextResponse.json({ error: "個人數據含非參與球員" }, { status: 400 });
    }
  }

  const opponentTrim = body.opponentName?.trim() || null;
  const notesTrim = body.notes?.trim() || null;

  const saved = await prisma.$transaction(async (tx) => {
    const result = await tx.matchResult.upsert({
      where: { eventId },
      create: {
        eventId,
        opponentName: opponentTrim,
        sets: body.sets,
        teamStats: body.teamStats ?? undefined,
        notes: notesTrim,
        recordedByMemberId: member.id,
      },
      update: {
        opponentName: opponentTrim,
        sets: body.sets,
        teamStats: body.teamStats ?? undefined,
        notes: notesTrim,
        recordedByMemberId: member.id,
      },
    });

    await tx.matchPlayerStat.deleteMany({ where: { matchResultId: result.id } });

    if (playerStatsToSave.length > 0) {
      await tx.matchPlayerStat.createMany({
        data: playerStatsToSave.map((p) => ({
          matchResultId: result.id,
          memberId: p.memberId,
          stats: matchMod.compactPlayerStats(p.stats),
        })),
      });
    }

    return tx.matchResult.findUniqueOrThrow({
      where: { id: result.id },
      include: {
        playerStats: {
          include: { member: { include: { user: { select: { name: true, email: true } } } } },
          orderBy: { member: { jerseyNumber: "asc" } },
        },
      },
    });
  });

  return NextResponse.json({ result: serializeResult(saved, matchMod) });
}

/** 教練：清除比賽結果。 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
    select: { id: true, type: true, status: true, endsAt: true },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  if (!canManageMatchResult(member, event)) {
    return NextResponse.json({ error: "無法刪除" }, { status: 403 });
  }

  await prisma.matchResult.deleteMany({ where: { eventId } });
  return NextResponse.json({ ok: true });
}
