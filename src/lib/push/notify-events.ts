import { CommentType, EventStatus } from "@/generated/prisma/client";
import { buildPushPayload, rsvpStatusLabel } from "@/lib/push/kinds";
import {
  dispatchPush,
  getActiveTeamUserIds,
  getCoachSideUserIds,
  getEventParticipantUserIds,
  notifyUserIds,
} from "@/lib/push/dispatch";

/** 發布活動 → 全隊 ACTIVE 成員。 */
export function notifyTeamEventPublished(teamId: string, eventId: string, eventTitle: string) {
  dispatchPush(async () => {
    const userIds = await getActiveTeamUserIds(teamId);
    const payload = buildPushPayload({
      kind: "event_published",
      teamId,
      eventId,
      eventTitle,
    });
    return notifyUserIds(userIds, payload);
  });
}

/** 已發布活動內容更新 → 事件參與者。 */
export function notifyEventUpdated(teamId: string, eventId: string, eventTitle: string) {
  dispatchPush(async () => {
    const userIds = await getEventParticipantUserIds(eventId);
    const payload = buildPushPayload({
      kind: "event_updated",
      teamId,
      eventId,
      eventTitle,
    });
    return notifyUserIds(userIds, payload);
  });
}

/** 教練公告 → 事件參與者（不含發文者）。 */
export function notifyEventAnnouncement(args: {
  teamId: string;
  eventId: string;
  eventTitle: string;
  authorUserId: string;
  authorName: string;
  preview: string;
}) {
  dispatchPush(async () => {
    const userIds = await getEventParticipantUserIds(args.eventId);
    const payload = buildPushPayload({
      kind: "event_announcement",
      teamId: args.teamId,
      eventId: args.eventId,
      eventTitle: args.eventTitle,
      authorName: args.authorName,
      preview: args.preview,
    });
    return notifyUserIds(userIds, payload, { excludeUserId: args.authorUserId });
  });
}

/** 留言 → 教練發給參與者；球員發給教練端（不含發文者）。 */
export function notifyEventComment(args: {
  teamId: string;
  eventId: string;
  eventTitle: string;
  authorUserId: string;
  authorName: string;
  preview: string;
  commentType: CommentType;
  fromCoachSide: boolean;
}) {
  dispatchPush(async () => {
    const payload = buildPushPayload({
      kind: args.commentType === CommentType.ANNOUNCEMENT ? "event_announcement" : "event_comment",
      teamId: args.teamId,
      eventId: args.eventId,
      eventTitle: args.eventTitle,
      authorName: args.authorName,
      preview: args.preview,
      path:
        args.fromCoachSide ?
          `/player/events/${args.eventId}`
        : `/coach/events/${args.eventId}`,
    });

    const userIds =
      args.fromCoachSide ?
        await getEventParticipantUserIds(args.eventId)
      : await getCoachSideUserIds(args.teamId);

    return notifyUserIds(userIds, payload, { excludeUserId: args.authorUserId });
  });
}

/** 球員 RSVP → 教練端（不含本人若為教練兼球員）。 */
export function notifyRsvpUpdated(args: {
  teamId: string;
  eventId: string;
  eventTitle: string;
  playerUserId: string;
  playerName: string;
  rsvpStatus: string;
}) {
  dispatchPush(async () => {
    const userIds = await getCoachSideUserIds(args.teamId);
    const payload = buildPushPayload({
      kind: "rsvp_updated",
      teamId: args.teamId,
      eventId: args.eventId,
      eventTitle: args.eventTitle,
      authorName: args.playerName,
      rsvpLabel: rsvpStatusLabel(args.rsvpStatus),
    });
    return notifyUserIds(userIds, payload, { excludeUserId: args.playerUserId });
  });
}

/** 是否應對已發布事件發送「資訊更新」推播（註解：僅 PUBLISHED 狀態）。 */
export function shouldNotifyEventUpdated(previousStatus: EventStatus): boolean {
  return previousStatus === EventStatus.PUBLISHED;
}

/** 教練催 RSVP → 指定未回覆球員（註解：App 內通知 + FCM）。 */
export function notifyRsvpReminder(args: {
  teamId: string;
  eventId: string;
  eventTitle: string;
  userIds: string[];
}) {
  if (args.userIds.length === 0) return;

  dispatchPush(async () => {
    const payload = buildPushPayload({
      kind: "rsvp_reminder",
      teamId: args.teamId,
      eventId: args.eventId,
      eventTitle: args.eventTitle,
    });
    return notifyUserIds(args.userIds, payload);
  });
}
