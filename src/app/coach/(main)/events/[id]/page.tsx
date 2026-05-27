import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { parseGroupConfig } from "@/lib/group-config";
import { AttendanceTable } from "@/app/coach/(main)/events/[id]/attendance-table";
import { EventPublishButton } from "@/app/coach/(main)/events/[id]/event-detail-actions";
import { EventEditForm } from "@/app/coach/(main)/events/[id]/event-edit-form";
import { CoachEventCommentsPanel } from "@/app/coach/(main)/events/[id]/coach-event-comments-panel";
import { CoachEventTacticalVideoPanel } from "@/app/coach/(main)/events/[id]/event-tactical-video-panel";
import { CoachPlayerReviewsPanel } from "@/app/coach/(main)/events/[id]/coach-player-reviews-panel";
import { EventFeedbackSummarySection } from "@/app/coach/(main)/events/[id]/feedback-summary-section";
import { CourtFormationEditor } from "@/app/coach/(main)/events/[id]/court-formation-editor";
import { TrainingPlanPanel } from "@/app/coach/(main)/events/[id]/training-plan-panel";
import { getDebugTeamMember } from "@/lib/debug-session";
import { canManageEventCommentsAsStaff } from "@/lib/event-comment-access";
import { inferParticipantRuleFromRoster } from "@/lib/infer-participant-rule";
import { isEventEnded } from "@/lib/event-timing";
import { isPlayerReviewSubjectRole } from "@/lib/player-review-access";
import { coachMemberUserSelect } from "@/lib/event-response-sanitize";
import { parseCourtSketch } from "@/lib/court-sketch-schema";
import { MatchResultPanel } from "@/app/coach/(main)/events/[id]/match-result-panel";
import { canManageMatchResult } from "@/lib/match-result-access";
import type { MatchSetScore, MatchTeamStats } from "@/lib/match-result-schema";
import { EMPTY_PLAYER_STATS, normalizePlayerStats } from "@/lib/match-result-schema";
import { CoachEventDetailCollapsibleSection } from "@/components/coach-event-detail-collapsible-section";
import { CoachEventDetailSectionNav } from "@/components/coach-event-detail-section-nav";
import { EventTitleWithMeta } from "@/components/event-title-with-meta";
import {
  EventStatusIndicator,
  EventStatusLegend,
} from "@/components/domain-status-indicators";
import { HintExclamationToggle } from "@/components/hint-exclamation-toggle";
import { getPrisma } from "@/lib/prisma";
import { formatDateTimeZh } from "@/lib/format-datetime";
import {
  EventStatus,
  EventType,
  FileAssetCategory,
  FileAssetKind,
  MemberStatus,
} from "@/generated/prisma/client";

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

/** 與下方 `<section id>` 對齊（註解：段落導覽列；不含時間地點，已併入頁首）。 */
const COACH_EVENT_DETAIL_SECTIONS = [
  { id: "coach-ev-edit", label: "編輯" },
  { id: "coach-ev-attendance", label: "出席點名" },
  { id: "coach-ev-training", label: "訓練計畫" },
  { id: "coach-ev-court", label: "企位" },
  { id: "coach-ev-media", label: "戰術影片" },
  { id: "coach-ev-comments", label: "公告留言" },
  { id: "coach-ev-reviews", label: "球員評語" },
  { id: "coach-ev-match", label: "比賽結果" },
  { id: "coach-ev-feedback", label: "身體回饋" },
] as const;

/** 事件詳情：發布、出席／點名、訓練計畫（註解：資料由伺服端直查 DB）。 */
export default async function CoachEventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const member = await getDebugTeamMember();
  if (!member) return null;

  const prisma = getPrisma();
  const event = await prisma.event.findFirst({
    where: { id, teamId: member.teamId },
    include: {
      participants: { select: { memberId: true } },
      attendance: {
        include: {
          member: { include: { user: coachMemberUserSelect } },
        },
      },
      trainingPlan: {
        include: { blocks: { orderBy: { order: "asc" } } },
      },
      matchResult: {
        include: {
          playerStats: {
            include: { member: { include: { user: coachMemberUserSelect } } },
            orderBy: { member: { jerseyNumber: "asc" } },
          },
        },
      },
    },
  });

  if (!event) {
    const existsOtherTeam = await prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });
    /** 事件存在但非目前作用中隊伍（註解：切隊後避免 404）。 */
    if (existsOtherTeam) {
      redirect("/coach/events");
    }
    notFound();
  }

  const attendanceRows = event.attendance.map((a) => ({
    memberId: a.memberId,
    displayName: a.member.user?.name ?? a.member.user?.email ?? a.memberId.slice(0, 8),
    rsvpStatus: a.rsvpStatus,
    rsvpReason: a.rsvpReason,
    rsvpAtIso: a.rsvpAt?.toISOString() ?? null,
    checkedIn: a.checkedIn,
  }));

  const plan =
    event.trainingPlan ?
      {
        title: event.trainingPlan.title,
        summary: event.trainingPlan.summary,
        safetyNotes: event.trainingPlan.safetyNotes,
        blocks: event.trainingPlan.blocks,
      }
    : null;

  const eventEnded = isEventEnded(event.endsAt);
  const canEditEvent = event.status !== EventStatus.CANCELLED && !eventEnded;

  const [feedbackRows, mediaLinks, commentRows, playerReviewRows, teamRow] = await Promise.all([
    prisma.feedback.findMany({
      where: { eventId: event.id },
      include: {
        member: { include: { user: coachMemberUserSelect } },
      },
      orderBy: { submittedAt: "desc" },
    }),
    prisma.fileAsset.findMany({
      where: {
        eventId: event.id,
        kind: FileAssetKind.LINK,
        category: { in: [FileAssetCategory.TACTICAL_BOARD, FileAssetCategory.VIDEO] },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.findMany({
      where: { eventId: event.id },
      include: { author: { include: { user: { select: { name: true, email: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    eventEnded && event.status === EventStatus.PUBLISHED ?
      prisma.eventPlayerReview.findMany({
        where: { eventId: event.id },
        include: {
          author: { include: { user: { select: { name: true, email: true } } } },
        },
      })
    : Promise.resolve([]),
    prisma.team.findUnique({
      where: { id: member.teamId },
      select: { name: true, groupConfig: true },
    }),
  ]);

  const participantMemberIds = event.participants.map((p) => p.memberId);
  const participantRuleKey = [...participantMemberIds].sort().join("|");

  const squads = parseGroupConfig(teamRow?.groupConfig ?? null);

  const rosterRows = await prisma.teamMember.findMany({
    where: { teamId: member.teamId, status: MemberStatus.ACTIVE },
    include: { user: coachMemberUserSelect },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  const initialParticipantRuleResolved = inferParticipantRuleFromRoster(
    rosterRows.map((r) => ({ id: r.id, squad: r.squad })),
    participantMemberIds,
    squads,
  );

  const roster = rosterRows.map((r) => ({
    id: r.id,
    displayName: r.user.name ?? r.user.email ?? r.id.slice(0, 8),
    squad: r.squad,
    role: r.role,
  }));

  const tacticalLinks = mediaLinks
    .filter((a) => a.category === FileAssetCategory.TACTICAL_BOARD)
    .map((a) => ({
      id: a.id,
      url: a.url,
      name: a.name,
      createdAt: a.createdAt.toISOString(),
    }));
  const videoLinks = mediaLinks
    .filter((a) => a.category === FileAssetCategory.VIDEO)
    .map((a) => ({
      id: a.id,
      url: a.url,
      name: a.name,
      createdAt: a.createdAt.toISOString(),
    }));

  const feedbackEntries = feedbackRows.map((f) => ({
    id: f.id,
    displayName: f.member.user?.name ?? f.member.user?.email ?? f.memberId.slice(0, 8),
    rpe: f.rpe,
    fatigue: f.fatigue,
    painLevel: f.painLevel,
    painArea: f.painArea,
    note: f.note,
    submittedAt: f.submittedAt,
  }));

  const playerReviewByMember = new Map(playerReviewRows.map((r) => [r.memberId, r]));
  const coachPlayerReviewRows = event.attendance
    .filter((a) => isPlayerReviewSubjectRole(a.member.role))
    .map((a) => {
      const review = playerReviewByMember.get(a.memberId);
      return {
        memberId: a.memberId,
        displayName: a.member.user?.name ?? a.member.user?.email ?? a.memberId.slice(0, 8),
        review:
          review ?
            {
              id: review.id,
              content: review.content,
              authorName:
                review.author.user?.name?.trim() ||
                review.author.user?.email?.trim() ||
                "教練",
              updatedAt: review.updatedAt.toISOString(),
            }
          : null,
      };
    });

  const isMatchEvent = event.type === EventType.MATCH;
  const canManageMatch = canManageMatchResult(member, event);

  const matchPlayerRoster = roster
    .filter((r) => isPlayerReviewSubjectRole(r.role))
    .filter((r) => participantMemberIds.includes(r.id))
    .map((r) => ({
      memberId: r.id,
      displayName: r.displayName,
      stats: { ...EMPTY_PLAYER_STATS },
    }));

  const initialMatchResult =
    event.matchResult ?
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

  const detailSections = COACH_EVENT_DETAIL_SECTIONS.filter((s) => {
    if (!isMatchEvent && s.id === "coach-ev-match") return false;
    if (!eventEnded) {
      return s.id !== "coach-ev-reviews" && s.id !== "coach-ev-match";
    }
    return s.id !== "coach-ev-edit" && s.id !== "coach-ev-training";
  });

  /** 已結束場次：身體回饋、球員評語、比賽結果置頂（註解：段落導覽順序同步）。 */
  const orderedDetailSections =
    eventEnded ?
      [
        ...detailSections.filter(
          (s) =>
            s.id === "coach-ev-feedback" ||
            s.id === "coach-ev-reviews" ||
            s.id === "coach-ev-match",
        ),
        ...detailSections.filter(
          (s) =>
            s.id !== "coach-ev-feedback" &&
            s.id !== "coach-ev-reviews" &&
            s.id !== "coach-ev-match",
        ),
      ]
    : detailSections;

  const playerReviewsSection =
    eventEnded && event.status === EventStatus.PUBLISHED ?
      <CoachEventDetailCollapsibleSection
        id="coach-ev-reviews"
        title="球員評語"
        titleExtra={
          <HintExclamationToggle>
            事件結束後，可對每位球員寫下私評；僅教練與該球員本人可見，其他隊員無法看到。
          </HintExclamationToggle>
        }
      >
        <CoachPlayerReviewsPanel
          eventId={event.id}
          rows={coachPlayerReviewRows}
          canEdit={event.status === EventStatus.PUBLISHED}
        />
      </CoachEventDetailCollapsibleSection>
    : null;

  const matchResultSection =
    isMatchEvent ?
      <CoachEventDetailCollapsibleSection
        id="coach-ev-match"
        title="比賽結果"
        titleExtra={
          <HintExclamationToggle>
            比賽結束後可登錄各局比分、球隊數據與個人數據（一傳、防守、進攻、攔網、發球）；儲存後以圖表檢視。
          </HintExclamationToggle>
        }
      >
        <MatchResultPanel
          eventId={event.id}
          teamName={teamRow?.name ?? "我方"}
          canEdit={canManageMatch}
          initial={initialMatchResult}
          roster={matchPlayerRoster}
        />
      </CoachEventDetailCollapsibleSection>
    : null;

  const feedbackSummarySection = (
    <CoachEventDetailCollapsibleSection id="coach-ev-feedback" title="身體回饋">
      <EventFeedbackSummarySection
        eventEndsAt={event.endsAt}
        entries={feedbackEntries}
        embedded
      />
    </CoachEventDetailCollapsibleSection>
  );

  const initialEventComments = commentRows.map((c) => ({
    id: c.id,
    type: c.type,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    authorMemberId: c.authorMemberId,
    authorName: c.author.user?.name?.trim() || c.author.user?.email || "成員",
  }));

  return (
    <div className="space-y-3">
      <div>
        <Link href="/coach/events" className="text-sm text-blue-600 hover:underline">
          ← 事件列表
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <EventTitleWithMeta
              title={event.title}
              startsAt={event.startsAt}
              endsAt={event.endsAt}
              locationName={event.locationName}
              ended={eventEnded}
            />
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <span>{typeLabel(event.type)}</span>
              <span aria-hidden className="text-zinc-400">
                ·
              </span>
              <EventStatusIndicator status={event.status} />
            </p>
            <EventStatusLegend className="mt-2" />
            {!eventEnded || event.meetAt != null ?
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {!eventEnded ?
                  <>
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">開始</dt>
                      <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                        {formatDateTimeZh(event.startsAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500 dark:text-zinc-400">結束</dt>
                      <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                        {formatDateTimeZh(event.endsAt)}
                      </dd>
                    </div>
                  </>
                : null}
                {event.meetAt ?
                  <div>
                    <dt className="text-zinc-500 dark:text-zinc-400">集合</dt>
                    <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatDateTimeZh(event.meetAt)}
                    </dd>
                  </div>
                : null}
                {!eventEnded && event.locationName ?
                  <div className="sm:col-span-2">
                    <dt className="text-zinc-500 dark:text-zinc-400">場館</dt>
                    <dd className="text-zinc-900 dark:text-zinc-50">{event.locationName}</dd>
                  </div>
                : null}
                {!eventEnded && event.rsvpDeadlineAt ?
                  <div>
                    <dt className="text-zinc-500 dark:text-zinc-400">出席意願截止</dt>
                    <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                      {formatDateTimeZh(event.rsvpDeadlineAt)}
                    </dd>
                  </div>
                : null}
              </dl>
            : null}
          </div>
          <EventPublishButton eventId={event.id} isDraft={event.status === EventStatus.DRAFT} />
        </div>
        <CoachEventDetailSectionNav sections={[...orderedDetailSections]} />
        {eventEnded ?
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            此場次已結束，可檢視點名、企位、留言
            {isMatchEvent ? "、比賽結果" : ""}
            、球員評語與身體回饋。
          </p>
        : isMatchEvent && !eventEnded ?
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            比賽結束後可登錄比分與數據。
          </p>
        : null}
      </div>

        {eventEnded ?
          <>
            {isMatchEvent ? matchResultSection : null}
            {feedbackSummarySection}
            {playerReviewsSection}
          </>
        : null}

      {canEditEvent ?
        <CoachEventDetailCollapsibleSection
          id="coach-ev-edit"
          title="編輯事件"
          titleExtra={
            <HintExclamationToggle>
              可調整標題、時間、場館、出席意願截止與參與對象；變更參與者時將同步名單與出席列。
            </HintExclamationToggle>
          }
        >
          <EventEditForm
            key={participantRuleKey}
            eventId={event.id}
            initial={{
              title: event.title,
              type: event.type,
              description: event.description,
              startsAtIso: event.startsAt.toISOString(),
              endsAtIso: event.endsAt.toISOString(),
              meetAtIso: event.meetAt?.toISOString() ?? null,
              locationName: event.locationName,
              rsvpDeadlineIso: event.rsvpDeadlineAt?.toISOString() ?? null,
            }}
            squads={squads}
            roster={roster}
            initialParticipantRule={initialParticipantRuleResolved}
          />
        </CoachEventDetailCollapsibleSection>
      : event.status === EventStatus.CANCELLED ?
        <CoachEventDetailCollapsibleSection id="coach-ev-edit" title="編輯事件">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">已取消的事件無法編輯。</p>
        </CoachEventDetailCollapsibleSection>
      : null}

      <CoachEventDetailCollapsibleSection id="coach-ev-attendance" title="出席點名">
        <AttendanceTable
          eventId={event.id}
          rows={attendanceRows}
          isPublished={event.status === EventStatus.PUBLISHED}
        />
      </CoachEventDetailCollapsibleSection>

      {!eventEnded ?
        <CoachEventDetailCollapsibleSection id="coach-ev-training" title="訓練計畫">
          <TrainingPlanPanel
            eventId={event.id}
            isTraining={event.type === EventType.TRAINING}
            initialPlan={plan}
          />
        </CoachEventDetailCollapsibleSection>
      : null}

      <CoachEventDetailCollapsibleSection
        id="coach-ev-court"
        title="場上企位"
        titleExtra={
          <HintExclamationToggle>
            全場示意（左為對方、右為我方）：球員／排球標記、畫線；儲存後球員於本事件頁可唯讀檢視。
          </HintExclamationToggle>
        }
      >
        <CourtFormationEditor
          variant="event"
          eventId={event.id}
          initial={parseCourtSketch(event.courtSketch)}
          disabled={event.status === EventStatus.CANCELLED}
        />
      </CoachEventDetailCollapsibleSection>

      <CoachEventDetailCollapsibleSection
        id="coach-ev-media"
        title="戰術板與影片"
        titleExtra={
          <HintExclamationToggle>
            外部白板、錄影連結集中管理；球員在已發布事件中可見（唯讀）。
          </HintExclamationToggle>
        }
      >
        <CoachEventTacticalVideoPanel
          eventId={event.id}
          canEdit={event.status !== EventStatus.CANCELLED}
          tactical={tacticalLinks}
          video={videoLinks}
        />
      </CoachEventDetailCollapsibleSection>

      <CoachEventDetailCollapsibleSection
        id="coach-ev-comments"
        title="公告與留言"
        titleExtra={
          <HintExclamationToggle>
            發布公告或討論；球員在「我的行程」對應事件頁可見（事件須已發布且對方為參與者）。
          </HintExclamationToggle>
        }
      >
        <CoachEventCommentsPanel
          eventId={event.id}
          currentMemberId={member.id}
          canManageAll={canManageEventCommentsAsStaff(member)}
          initialComments={initialEventComments}
        />
      </CoachEventDetailCollapsibleSection>

      {!eventEnded ? feedbackSummarySection : null}
    </div>
  );
}
