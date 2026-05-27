import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MatchResultReadonly } from "@/app/player/(main)/events/[id]/match-result-readonly";
import { EventTitleWithMeta } from "@/components/event-title-with-meta";
import { CourtFormationReadonly } from "@/app/player/(main)/events/[id]/court-formation-readonly";
import { PlayerEventTacticalVideoReadonly } from "@/app/player/(main)/events/[id]/event-tactical-video-readonly";
import { PlayerCoachReviewSection } from "@/app/player/(main)/events/[id]/player-coach-review-section";
import { PlayerEventComments } from "@/app/player/(main)/events/[id]/player-event-comments";
import { EventStatus, EventType, FileAssetCategory, FileAssetKind } from "@/generated/prisma/client";
import { parseCourtSketch } from "@/lib/court-sketch-schema";
import { normalizePlayerStats, type MatchSetScore, type MatchTeamStats } from "@/lib/match-result-schema";
import { getTeamMember } from "@/lib/session";
import { getPrisma } from "@/lib/prisma";

import { PlayerFeedbackForm } from "./feedback-form";
import { PlayerFeedbackViewCard } from "@/components/player-feedback-view-card";
import { PlayerRsvpForm } from "./rsvp-form";
import { formatDateTimeZh, formatDateZh, formatTimeZh } from "@/lib/format-datetime";

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

function renderStepsJson(steps: unknown): React.ReactNode {
  if (steps == null) return null;
  if (Array.isArray(steps)) {
    return (
      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
        {steps.map((s, i) => (
          <li key={i}>{typeof s === "string" ? s : JSON.stringify(s)}</li>
        ))}
      </ol>
    );
  }
  if (typeof steps === "object") {
    return (
      <pre className="overflow-x-auto rounded bg-slate-50 dark:bg-slate-950 p-2 text-xs text-slate-700 dark:text-slate-300">
        {JSON.stringify(steps, null, 2)}
      </pre>
    );
  }
  return <span className="text-sm text-slate-700 dark:text-slate-300">{String(steps)}</span>;
}

type PageProps = { params: Promise<{ id: string }> };

/** 球員事件詳情：RSVP、訓練計畫唯讀、結束後回饋（註解：僅已發布且為參與者）。 */
export default async function PlayerEventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const member = await getTeamMember();
  if (!member) return null;

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: {
      id,
      teamId: member.teamId,
      status: EventStatus.PUBLISHED,
      participants: { some: { memberId: member.id } },
    },
    include: {
      attendance: {
        where: { memberId: member.id },
        take: 1,
      },
      trainingPlan: {
        include: {
          blocks: { orderBy: { order: "asc" } },
        },
      },
      matchResult: {
        include: {
          playerStats: {
            include: { member: { include: { user: { select: { name: true, email: true } } } } },
            orderBy: { member: { jerseyNumber: "asc" } },
          },
        },
      },
      team: { select: { name: true } },
    },
  });

  if (!event) {
    const exists = await prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });
    /** 事件存在但非目前隊伍／無權限時（註解：切隊後避免 404）。 */
    if (exists) {
      redirect("/player");
    }
    notFound();
  }

  const att = event.attendance[0];
  const rsvp = att?.rsvpStatus ?? "UNANSWERED";
  const now = new Date();
  const afterEnd = now.getTime() >= event.endsAt.getTime();
  /** 有設定截止且已過期則鎖定出席意願（註解：與 PATCH /api/events/[id]/rsvp 一致）。 */
  const rsvpDeadlineAt = event.rsvpDeadlineAt;
  const rsvpLocked =
    rsvpDeadlineAt != null && now.getTime() > rsvpDeadlineAt.getTime();
  const [feedback, mediaLinks, commentRows, coachReview] = await Promise.all([
    prisma.feedback.findUnique({
      where: { eventId_memberId: { eventId: event.id, memberId: member.id } },
    }),
    prisma.fileAsset.findMany({
      where: {
        eventId: event.id,
        kind: FileAssetKind.LINK,
        category: { in: [FileAssetCategory.TACTICAL_BOARD, FileAssetCategory.VIDEO] },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.comment.findMany({
      where: { eventId: event.id },
      include: { author: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    afterEnd ?
      prisma.eventPlayerReview.findUnique({
        where: { eventId_memberId: { eventId: event.id, memberId: member.id } },
        include: { author: { include: { user: { select: { name: true } } } } },
      })
    : Promise.resolve(null),
  ]);

  const tacticalForPlayer = mediaLinks
    .filter((a) => a.category === FileAssetCategory.TACTICAL_BOARD)
    .map((a) => ({ id: a.id, url: a.url, name: a.name }));
  const videoForPlayer = mediaLinks
    .filter((a) => a.category === FileAssetCategory.VIDEO)
    .map((a) => ({ id: a.id, url: a.url, name: a.name }));

  const courtSketchParsed = parseCourtSketch(event.courtSketch);

  const initialPlayerComments = commentRows.map((c) => ({
    id: c.id,
    type: c.type,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    authorMemberId: c.authorMemberId,
    authorName: c.author.user?.name?.trim() || "成員",
  }));

  /** 結束後可填寫；若已提交則 24 小時內可改（註解：與 API 一致）。 */
  const feedbackEditDeadline =
    feedback != null ? feedback.submittedAt.getTime() + 24 * 60 * 60 * 1000 : null;
  const canEditFeedback =
    afterEnd &&
    (feedback == null || (feedbackEditDeadline != null && now.getTime() <= feedbackEditDeadline));
  const feedbackReadOnly = afterEnd && feedback != null && !canEditFeedback;

  const coachReviewBlock =
    afterEnd && coachReview ?
      <PlayerCoachReviewSection
        content={coachReview.content}
        authorName={coachReview.author.user?.name?.trim() || "教練"}
        updatedAt={coachReview.updatedAt}
        eventTitle={event.title}
      />
    : null;

  const matchResultData =
    afterEnd && event.type === EventType.MATCH && event.matchResult ?
      {
        opponentName: event.matchResult.opponentName,
        sets: event.matchResult.sets as MatchSetScore[],
        teamStats: (event.matchResult.teamStats as MatchTeamStats | null) ?? null,
        notes: event.matchResult.notes,
        playerStats: event.matchResult.playerStats.map((p) => ({
          memberId: p.memberId,
          displayName: p.member.user?.name ?? p.member.user?.email ?? p.memberId.slice(0, 8),
          stats: normalizePlayerStats(p.stats),
        })),
      }
    : null;

  const matchResultBlock =
    matchResultData ?
      <section id="player-ev-match-stats" className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">比賽數據</h2>
        <MatchResultReadonly
          data={matchResultData}
          teamName={event.team.name}
          currentMemberId={member.id}
        />
      </section>
    : afterEnd && event.type === EventType.MATCH ?
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">比賽數據</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">教練尚未登錄比賽結果。</p>
      </section>
    : null;

  const feedbackBlock = (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">身體回饋</h2>
      {!afterEnd ?
        <p className="text-sm text-slate-600 dark:text-slate-400">事件結束後可填寫身體回饋（RPE／疲勞／疼痛）。</p>
      : canEditFeedback ?
        <PlayerFeedbackForm
          eventId={event.id}
          initial={
            feedback ?
              {
                rpe: feedback.rpe,
                fatigue: feedback.fatigue,
                painLevel: feedback.painLevel,
                painArea: feedback.painArea,
                note: feedback.note,
              }
            : undefined
          }
        />
      : feedbackReadOnly && feedback ?
        <PlayerFeedbackViewCard
          data={{
            rpe: feedback.rpe,
            fatigue: feedback.fatigue,
            painLevel: feedback.painLevel,
            painArea: feedback.painArea,
            note: feedback.note,
            submittedAt: feedback.submittedAt.toISOString(),
          }}
        />
      : null}
    </section>
  );

  return (
    <div className="space-y-8">
      <div>
        <Link href="/player" className="text-sm text-blue-600 hover:underline">
          ← 我的行程
        </Link>
        <div className="mt-2">
        <EventTitleWithMeta
          title={event.title}
          startsAt={event.startsAt}
          endsAt={event.endsAt}
          locationName={event.locationName}
          ended={afterEnd}
          titleClassName="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50"
          metaClassName="text-sm font-normal text-slate-500 dark:text-slate-400"
        />
        {!afterEnd ?
          <>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {typeLabel(event.type)} ·{" "}
              {formatDateTimeZh(event.startsAt, {
                weekday: "long",
                month: "numeric",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
              {" — "}
              {formatTimeZh(event.endsAt, { hour: "2-digit", minute: "2-digit" })}
            </p>
            {event.locationName ?
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">地點：{event.locationName}</p>
            : null}
          </>
        : (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{typeLabel(event.type)}</p>
        )}
        {event.description ?
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{event.description}</p>
        : null}
        {!afterEnd && rsvpDeadlineAt ?
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            出席意願截止：
            {formatDateTimeZh(rsvpDeadlineAt, {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {rsvpLocked ? <span className="font-medium text-amber-800">（已截止）</span> : null}
          </p>
        : null}
        </div>
      </div>

      {coachReviewBlock}

      {matchResultBlock}

      {afterEnd ? feedbackBlock : null}

      {!afterEnd ?
        <>
          <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/80 p-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">我的狀態</h2>
            <dl className="mt-2 grid gap-1 text-sm text-slate-700 dark:text-slate-300">
              <div>
                <dt className="inline text-slate-500 dark:text-slate-400">出席意願：</dt>
                <dd className="inline">
                  {rsvp === "UNANSWERED" ? "尚未回覆" : rsvp === "YES" ? "會到" : rsvp === "NO" ? "不到" : "不一定"}
                </dd>
              </div>
              <div>
                <dt className="inline text-slate-500 dark:text-slate-400">點名：</dt>
                <dd className="inline">{att?.checkedIn ? "已簽到" : "未簽到／尚未點名"}</dd>
              </div>
            </dl>
          </section>

          <PlayerRsvpForm
            eventId={event.id}
            initialRsvp={rsvp}
            initialReason={att?.rsvpReason ?? null}
            disabled={rsvpLocked}
            disabledReason={rsvpLocked ? "deadline" : undefined}
          />
        </>
      : null}

      {event.type === EventType.TRAINING && event.trainingPlan ?
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">訓練計畫</h2>
          {event.trainingPlan.summary ?
            <p className="text-sm text-slate-700 dark:text-slate-300">{event.trainingPlan.summary}</p>
          : null}
          {event.trainingPlan.safetyNotes ?
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              安全提醒：{event.trainingPlan.safetyNotes}
            </p>
          : null}
          <ul className="space-y-4">
            {event.trainingPlan.blocks.map((b) => (
              <li key={b.id} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    {b.order}. {b.name}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{b.minutes} 分鐘</span>
                </div>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">目標：{b.goal}</p>
                {b.setup ?
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">器材／場地：{b.setup}</p>
                : null}
                <div className="mt-2">{renderStepsJson(b.steps)}</div>
              </li>
            ))}
          </ul>
        </section>
      : event.type === EventType.TRAINING ?
        <p className="text-sm text-slate-500 dark:text-slate-400">教練尚未發布訓練計畫。</p>
      : null}

      <PlayerEventTacticalVideoReadonly tactical={tacticalForPlayer} video={videoForPlayer} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">場上企位</h2>
        <CourtFormationReadonly data={courtSketchParsed} />
      </section>

      <PlayerEventComments
        eventId={event.id}
        currentMemberId={member.id}
        initialComments={initialPlayerComments}
      />

      {!afterEnd ? feedbackBlock : null}
    </div>
  );
}
