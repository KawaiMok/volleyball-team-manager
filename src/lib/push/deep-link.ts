import type { PushKind } from "@/lib/push/kinds";

/** 依推播種類與 eventId 產生 App 內路徑（註解：寫入 FCM `data.path`）。 */
export function pushDeepLinkPath(kind: PushKind, eventId?: string): string {
  switch (kind) {
    case "push_test":
      return "/";
    case "event_published":
    case "event_updated":
    case "event_announcement":
      return eventId ? `/player/events/${eventId}` : "/player";
    case "event_comment":
      return eventId ? `/player/events/${eventId}` : "/player";
    case "rsvp_updated":
      return eventId ? `/coach/events/${eventId}` : "/coach/events";
    case "rsvp_reminder":
      return eventId ? `/player/events/${eventId}` : "/player";
  }
}

/** 從 FCM data 解析路徑（註解：Capacitor 點擊通知用；相容舊版僅含 eventId）。 */
export function resolvePathFromPushData(data: Record<string, string>): string | null {
  const path = data.path?.trim();
  if (path && path.startsWith("/")) return path;

  const eventId = data.eventId?.trim();
  if (!eventId) return null;

  const type = data.type as PushKind | undefined;
  if (type) return pushDeepLinkPath(type, eventId);

  return `/player/events/${eventId}`;
}

/** 正規化為 pathname + search（註解：拒絕外站 URL）。 */
export function normalizeInAppPath(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;
  try {
    const u = new URL(trimmed);
    if (u.protocol === "http:" || u.protocol === "https:") {
      return u.pathname + u.search;
    }
  } catch {
    return null;
  }
  return null;
}
