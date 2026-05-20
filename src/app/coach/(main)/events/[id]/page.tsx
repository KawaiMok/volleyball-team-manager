import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { parseGroupConfig } from "@/lib/group-config";
import { AttendanceTable } from "@/app/coach/(main)/events/[id]/attendance-table";
import { EventPublishButton } from "@/app/coach/(main)/events/[id]/event-detail-actions";
import { EventEditForm } from "@/app/coach/(main)/events/[id]/event-edit-form";
import { CoachEventCommentsPanel } from "@/app/coach/(main)/events/[id]/coach-event-comments-panel";
import { CoachEventTacticalVideoPanel } from "@/app/coach/(main)/events/[id]/event-tactical-video-panel";
import { EventFeedbackSummarySection } from "@/app/coach/(main)/events/[id]/feedback-summary-section";
import { CourtFormationEditor } from "@/app/coach/(main)/events/[id]/court-formation-editor";
import { TrainingPlanPanel } from "@/app/coach/(main)/events/[id]/training-plan-panel";
import { getDebugTeamMember } from "@/lib/debug-session";
import { canManageEventCommentsAsStaff } from "@/lib/event-comment-access";
import { inferParticipantRule } from "@/lib/infer-participant-rule";
import { isEventEnded } from "@/lib/event-timing";
import { parseCourtSketch } from "@/lib/court-sketch-schema";
import { CoachEventDetailSectionNav } from "@/components/coach-event-detail-section-nav";
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

/** 與下方 `<section id>` 對齊（註解：段落導覽列）。 */
const COACH_EVENT_DETAIL_SECTIONS = [
  { id: "coach-ev-when", label: "時間地點" },
  { id: "coach-ev-edit", label: "編輯" },
  { id: "coach-ev-attendance", label: "出席點名" },
  { id: "coach-ev-training", label: "訓練計畫" },
  { id: "coach-ev-court", label: "企位" },
  { id: "coach-ev-media", label: "戰術影片" },
  { id: "coach-ev-comments", label: "公告留言" },
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
          member: { include: { user: true } },
        },
      },
      trainingPlan: {
        include: { blocks: { orderBy: { order: "asc" } } },
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

  const [feedbackRows, mediaLinks, commentRows] = await Promise.all([
    prisma.feedback.findMany({
      where: { eventId: event.id },
      include: {
        member: { include: { user: true } },
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
  ]);

  const participantMemberIds = event.participants.map((p) => p.memberId);
  const participantRuleKey = [...participantMemberIds].sort().join("|");

  const teamRow = await prisma.team.findUnique({
    where: { id: member.teamId },
    select: { groupConfig: true },
  });
  const squads = parseGroupConfig(teamRow?.groupConfig ?? null);

  const [rosterRows, initialParticipantRuleResolved] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: member.teamId, status: MemberStatus.ACTIVE },
      include: { user: { select: { name: true, email: true } } },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    }),
    inferParticipantRule(member.teamId, participantMemberIds, squads),
  ]);

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

  const eventEnded = isEventEnded(event.endsAt);
  const canEditEvent = event.status !== EventStatus.CANCELLED && !eventEnded;

  const detailSections = COACH_EVENT_DETAIL_SECTIONS.filter((s) => {
    if (!eventEnded) return true;
    return s.id !== "coach-ev-edit" && s.id !== "coach-ev-training";
  });

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
    <div className="space-y-8">
      <div>
        <Link href="/coach/events" className="text-sm text-blue-600 hover:underline">
          ← 事件列表
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
              <span>{typeLabel(event.type)}</span>
              <span aria-hidden className="text-zinc-400">
                ·
              </span>
              <EventStatusIndicator status={event.status} />
            </p>
            <EventStatusLegend className="mt-2" />
          </div>
          <EventPublishButton eventId={event.id} isDraft={event.status === EventStatus.DRAFT} />
        </div>
        <CoachEventDetailSectionNav sections={[...detailSections]} />
        {eventEnded ?
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">此場次已結束，僅可檢視點名、企位、留言與身體回饋。</p>
        : null}
      </div>

      <section
        id="coach-ev-when"
        className="scroll-mt-28 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">時間與地點</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
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
          {event.meetAt ?
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">集合</dt>
              <dd className="font-medium tabular-nums">{formatDateTimeZh(event.meetAt)}</dd>
            </div>
          : null}
          {event.locationName ?
            <div className="sm:col-span-2">
              <dt className="text-zinc-500 dark:text-zinc-400">場館</dt>
              <dd>{event.locationName}</dd>
            </div>
          : null}
          {event.rsvpDeadlineAt ?
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">RSVP 截止</dt>
              <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatDateTimeZh(event.rsvpDeadlineAt)}
              </dd>
            </div>
          : null}
        </dl>
      </section>

      {canEditEvent ?
        <section
          id="coach-ev-edit"
          className="scroll-mt-28 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">編輯事件</h2>
            <HintExclamationToggle>
              可調整標題、時間、場館、RSVP 截止與參與對象；變更參與者時將同步名單與出席列。
            </HintExclamationToggle>
          </div>
          <div className="mt-4">
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
          </div>
        </section>
      : event.status === EventStatus.CANCELLED ?
        <section
          id="coach-ev-edit"
          className="scroll-mt-28 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-4 shadow-sm"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">已取消的事件無法編輯。</p>
        </section>
      : null}

      <section
        id="coach-ev-attendance"
        className="scroll-mt-28 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
      >
        <div className="mt-3">
          <AttendanceTable eventId={event.id} rows={attendanceRows} />
        </div>
      </section>

      {!eventEnded ?
        <section
          id="coach-ev-training"
          className="scroll-mt-28 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">訓練計畫</h2>
          <div className="mt-3">
            <TrainingPlanPanel
              eventId={event.id}
              isTraining={event.type === EventType.TRAINING}
              initialPlan={plan}
            />
          </div>
        </section>
      : null}

      <section
        id="coach-ev-court"
        className="scroll-mt-28 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">場上企位</h2>
          <HintExclamationToggle>
            全場示意（左為對方、右為我方）：球員／排球標記、畫線；儲存後球員於本事件頁可唯讀檢視。
          </HintExclamationToggle>
        </div>
        <div className="mt-4">
          <CourtFormationEditor
            variant="event"
            eventId={event.id}
            initial={parseCourtSketch(event.courtSketch)}
            disabled={event.status === EventStatus.CANCELLED}
          />
        </div>
      </section>

      <section
        id="coach-ev-media"
        className="scroll-mt-28 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">戰術板與影片</h2>
          <HintExclamationToggle>
            外部白板、錄影連結集中管理；球員在已發布事件中可見（唯讀）。
          </HintExclamationToggle>
        </div>
        <div className="mt-4">
          <CoachEventTacticalVideoPanel
            eventId={event.id}
            canEdit={event.status !== EventStatus.CANCELLED}
            tactical={tacticalLinks}
            video={videoLinks}
          />
        </div>
      </section>

      <section
        id="coach-ev-comments"
        className="scroll-mt-28 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">公告與留言</h2>
          <HintExclamationToggle>
            發布公告或討論；球員在「我的行程」對應事件頁可見（事件須已發布且對方為參與者）。
          </HintExclamationToggle>
        </div>
        <div className="mt-4">
          <CoachEventCommentsPanel
            eventId={event.id}
            currentMemberId={member.id}
            canManageAll={canManageEventCommentsAsStaff(member)}
            initialComments={initialEventComments}
          />
        </div>
      </section>

      <EventFeedbackSummarySection
        eventEndsAt={event.endsAt}
        entries={feedbackEntries}
        anchorId="coach-ev-feedback"
      />
    </div>
  );
}
