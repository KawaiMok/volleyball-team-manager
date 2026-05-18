import { pushDeepLinkPath } from "@/lib/push/deep-link";
import type { PushNotificationPayload } from "@/lib/push/types";

/** 推播種類（註解：FCM `data.type` 與 App 深連結可共用）。 */
export type PushKind =
  | "push_test"
  | "event_published"
  | "event_updated"
  | "event_announcement"
  | "event_comment"
  | "rsvp_updated";

export type PushPayloadInput = {
  kind: PushKind;
  teamId: string;
  eventId?: string;
  eventTitle?: string;
  authorName?: string;
  preview?: string;
  rsvpLabel?: string;
  /** 覆寫預設深連結（註解：例如球員留言 → 教練事件頁）。 */
  path?: string;
};

const RSVP_LABELS: Record<string, string> = {
  YES: "參加",
  NO: "不參加",
  MAYBE: "未定",
};

function clip(text: string, max = 80): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * 依種類組出標題／內文／data（註解：FCM data 值皆為字串）。
 */
export function buildPushPayload(input: PushPayloadInput): PushNotificationPayload {
  const data: Record<string, string> = {
    type: input.kind,
    teamId: input.teamId,
  };
  if (input.eventId) {
    data.eventId = input.eventId;
  }
  data.path = input.path ?? pushDeepLinkPath(input.kind, input.eventId);

  switch (input.kind) {
    case "push_test":
      return {
        title: "排球隊管理",
        body: "測試推播：若你看到這則通知，設定已成功。",
        data,
      };
    case "event_published":
      return {
        title: "新活動",
        body: input.eventTitle ?? "教練已發布新活動",
        data,
      };
    case "event_updated":
      return {
        title: "活動資訊更新",
        body: input.eventTitle ? `「${input.eventTitle}」時間或地點等有變更` : "請查看最新內容",
        data,
      };
    case "event_announcement":
      return {
        title: input.eventTitle ? `公告：${input.eventTitle}` : "隊伍公告",
        body: input.preview ? clip(input.preview) : `${input.authorName ?? "教練"} 發布了公告`,
        data: { ...data, commentKind: "announcement" },
      };
    case "event_comment":
      return {
        title: input.eventTitle ? `留言：${input.eventTitle}` : "新留言",
        body: input.preview ?
          `${input.authorName ?? "成員"}：${clip(input.preview)}`
        : `${input.authorName ?? "成員"} 留了言`,
        data: { ...data, commentKind: "comment" },
      };
    case "rsvp_updated":
      return {
        title: "RSVP 更新",
        body:
          input.rsvpLabel && input.eventTitle ?
            `${input.authorName ?? "隊員"} 對「${input.eventTitle}」回覆：${input.rsvpLabel}`
          : input.eventTitle ?
            `${input.authorName ?? "隊員"} 更新了「${input.eventTitle}」的出席意願`
          : "有隊員更新了出席意願",
        data: { ...data, rsvpStatus: input.rsvpLabel ?? "" },
      };
  }
}

export function rsvpStatusLabel(status: string): string {
  return RSVP_LABELS[status] ?? status;
}
