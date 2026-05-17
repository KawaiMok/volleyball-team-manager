import type { PushPlatform } from "@/generated/prisma/client";

export type PushNotificationPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

/**
 * 之後接上 FCM HTTP v1 / APNs（註解：目前為 stub，僅供型別與呼叫點預留）。
 */
export async function sendPushToDevice(args: {
  token: string;
  platform: PushPlatform;
  payload: PushNotificationPayload;
}): Promise<{ ok: boolean; skipped?: string }> {
  void args;
  return { ok: false, skipped: "push_send_not_configured" };
}

/**
 * 依 userId 查所有裝置並發送（註解：業務層呼叫；與 `sendPushToDevice` 同為預留）。
 */
export async function sendPushToUserDevices(
  userId: string,
  payload: PushNotificationPayload,
) {
  void userId;
  void payload;
  return { sent: 0, skipped: "push_send_not_configured" as const };
}
