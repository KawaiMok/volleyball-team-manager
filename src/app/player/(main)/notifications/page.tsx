import { NotificationInbox } from "@/components/notifications/notification-inbox";

/** 球員端：推播／站內通知紀錄（註解：App 底部「通知」分頁）。 */
export default function PlayerNotificationsPage() {
  return <NotificationInbox backHref="/player" surface="player" />;
}
