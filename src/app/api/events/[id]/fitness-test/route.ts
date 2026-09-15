import { EventType } from "@/generated/prisma/client";
import { getDebugTeamMember } from "@/lib/debug-session";
import { canManageFitnessTest } from "@/lib/fitness-test-access";
import {
  compactFitnessStats,
  compactHeightCm,
  compactWeightKg,
  filterStatsToSelectedKeys,
  fitnessTestPutBodySchema,
  hasAnyFitnessResultRow,
  normalizeFitnessStats,
  normalizeFitnessTestItemKeys,
  parseFitnessStatsInput,
  type FitnessTestStats,
} from "@/lib/fitness/test-schema";
import { notifyFitnessResultsPublished } from "@/lib/push/notify-events";
import { isPlayerReviewSubjectRole } from "@/lib/player-review-access";
import { isCoachLike } from "@/lib/rbac";
import { getPrisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

function serializeSession(
  row: {
    id: string;
    protocolNote: string | null;
    equipmentNote: string | null;
    notes: string | null;
    updatedAt: Date;
    results: Array<{
      memberId: string;
      stats: unknown;
      heightCm: number | null;
      weightKg: number | null;
      member: { user: { name: string | null; email: string | null } | null };
    }>;
  },
  filterMemberId?: string,
) {
  const results = row.results
    .filter((r) => (filterMemberId ? r.memberId === filterMemberId : true))
    .map((r) => ({
      memberId: r.memberId,
      displayName: r.member.user?.name ?? r.member.user?.email ?? r.memberId.slice(0, 8),
      stats: normalizeFitnessStats(r.stats),
      heightCm: r.heightCm ?? null,
      weightKg: r.weightKg ?? null,
    }));

  return {
    id: row.id,
    protocolNote: row.protocolNote,
    equipmentNote: row.equipmentNote,
    notes: row.notes,
    updatedAt: row.updatedAt.toISOString(),
    results,
  };
}

/** 讀取體能測試（註解：教練全員；球員僅本人）。 */
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
  if (event.type !== EventType.FITNESS_TEST) {
    return NextResponse.json({ error: "僅體能測試事件可讀取數據" }, { status: 400 });
  }

  const session = await prisma.fitnessTestSession.findUnique({
    where: { eventId },
    include: {
      results: {
        include: { member: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { member: { jerseyNumber: "asc" } },
      },
    },
  });

  const coachView = isCoachLike(member);
  const filterMemberId = coachView ? undefined : member.id;

  return NextResponse.json({
    session: session ? serializeSession(session, filterMemberId) : null,
  });
}

/** 教練：儲存體能測試（註解：發布且開始後可 upsert）。 */
export async function PUT(req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
    select: {
      id: true,
      type: true,
      status: true,
      startsAt: true,
      endsAt: true,
      title: true,
      teamId: true,
      fitnessTestItemKeys: true,
    },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  if (event.type !== EventType.FITNESS_TEST) {
    return NextResponse.json({ error: "僅體能測試事件可登錄數據" }, { status: 400 });
  }
  if (!canManageFitnessTest(member, event)) {
    return NextResponse.json({ error: "事件尚未發布或尚未開始，無法登錄體能數據" }, { status: 403 });
  }

  const selectedItemKeys = normalizeFitnessTestItemKeys(event.fitnessTestItemKeys);

  let body: ReturnType<typeof fitnessTestPutBodySchema.parse>;
  try {
    body = fitnessTestPutBodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "請求內容格式錯誤" }, { status: 400 });
  }

  const participants = await prisma.eventParticipant.findMany({
    where: { eventId },
    include: { member: { select: { id: true, role: true } } },
  });
  const allowedIds = new Set(
    participants.filter((p) => isPlayerReviewSubjectRole(p.member.role)).map((p) => p.memberId),
  );

  const playerResultsToSave: {
    memberId: string;
    stats: FitnessTestStats;
    heightCm: number | null;
    weightKg: number | null;
  }[] = [];
  const playerResultsToDelete: string[] = [];

  for (const row of body.playerResults) {
    const parsedStats = parseFitnessStatsInput(row.stats);
    if (!parsedStats) {
      return NextResponse.json({ error: "無效的隊員或數據格式" }, { status: 400 });
    }
    const compact = filterStatsToSelectedKeys(compactFitnessStats(parsedStats), selectedItemKeys);
    const heightCm = compactHeightCm(row.heightCm ?? null);
    const weightKg = compactWeightKg(row.weightKg ?? null);
    const resultRow = { stats: compact, heightCm, weightKg };
    if (!allowedIds.has(row.memberId) && hasAnyFitnessResultRow(resultRow, selectedItemKeys)) {
      return NextResponse.json({ error: "個人數據含非參與球員" }, { status: 400 });
    }
    if (hasAnyFitnessResultRow(resultRow, selectedItemKeys)) {
      playerResultsToSave.push({
        memberId: row.memberId,
        stats: compact,
        heightCm,
        weightKg,
      });
    } else {
      playerResultsToDelete.push(row.memberId);
    }
  }

  const protocolNote = body.protocolNote?.trim() || null;
  const equipmentNote = body.equipmentNote?.trim() || null;
  const notes = body.notes?.trim() || null;

  const saved = await prisma.$transaction(async (tx) => {
    const session = await tx.fitnessTestSession.upsert({
      where: { eventId },
      create: {
        eventId,
        protocolNote,
        equipmentNote,
        notes,
      },
      update: {
        protocolNote,
        equipmentNote,
        notes,
      },
    });

    await tx.fitnessTestResult.deleteMany({
      where: {
        sessionId: session.id,
        memberId: { in: playerResultsToDelete },
      },
    });

    for (const p of playerResultsToSave) {
      await tx.fitnessTestResult.upsert({
        where: {
          sessionId_memberId: { sessionId: session.id, memberId: p.memberId },
        },
        create: {
          sessionId: session.id,
          memberId: p.memberId,
          stats: p.stats,
          heightCm: p.heightCm,
          weightKg: p.weightKg,
        },
        update: {
          stats: p.stats,
          heightCm: p.heightCm,
          weightKg: p.weightKg,
        },
      });
    }

    return tx.fitnessTestSession.findUniqueOrThrow({
      where: { id: session.id },
      include: {
        results: {
          include: { member: { include: { user: { select: { name: true, email: true } } } } },
          orderBy: { member: { jerseyNumber: "asc" } },
        },
      },
    });
  });

  if (playerResultsToSave.length > 0) {
    notifyFitnessResultsPublished({
      teamId: event.teamId,
      eventId: event.id,
      eventTitle: event.title,
      memberIds: playerResultsToSave.map((p) => p.memberId),
      authorUserId: member.userId,
    });
  }

  return NextResponse.json({ session: serializeSession(saved) });
}

/** 教練：清除體能測試數據。 */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id: eventId } = await ctx.params;
  const member = await getDebugTeamMember();
  if (!member) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id: eventId, teamId: member.teamId },
    select: { id: true, type: true, status: true, startsAt: true, endsAt: true },
  });
  if (!event) {
    return NextResponse.json({ error: "找不到事件" }, { status: 404 });
  }
  if (!canManageFitnessTest(member, event)) {
    return NextResponse.json({ error: "無法刪除" }, { status: 403 });
  }

  await prisma.fitnessTestSession.deleteMany({ where: { eventId } });
  return NextResponse.json({ ok: true });
}
