/** 隊伍層級通知偏好（註解：對應 `Team.notificationSettings` JSON）。 */

export type TeamNotificationSettings = {
  /** RSVP 截止前提醒球員（須後端寄信／排程接上後才生效）。 */
  emailRsvpReminderToPlayers: boolean;
  /** 每日或週摘要寄給教練／管理員（預留）。 */
  emailDigestToCoaches: boolean;
};

export const DEFAULT_TEAM_NOTIFICATION_SETTINGS: TeamNotificationSettings = {
  emailRsvpReminderToPlayers: false,
  emailDigestToCoaches: false,
};

export function parseTeamNotificationSettings(raw: unknown): TeamNotificationSettings {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_TEAM_NOTIFICATION_SETTINGS };
  }
  const o = raw as Record<string, unknown>;
  return {
    emailRsvpReminderToPlayers: Boolean(o.emailRsvpReminderToPlayers),
    emailDigestToCoaches: Boolean(o.emailDigestToCoaches),
  };
}
