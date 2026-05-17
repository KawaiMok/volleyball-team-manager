/** 推播標題／內文／自訂 data（註解：FCM data 值須為字串）。 */
export type PushNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};
