import { PushPlatform } from "@/generated/prisma/client";
import { sendFcmToToken } from "@/lib/push/fcm";
import { getPrisma } from "@/lib/prisma";
import type { PushNotificationPayload } from "@/lib/push/types";

export type { PushNotificationPayload } from "@/lib/push/types";

/**
 * 發送至單一裝置（註解：Android 走 FCM；iOS 待 APNs）。
 */
export async function sendPushToDevice(args: {
  token: string;
  platform: PushPlatform;
  payload: PushNotificationPayload;
}): Promise<{ ok: boolean; skipped?: string; error?: string }> {
  if (args.platform === PushPlatform.ANDROID) {
    const result = await sendFcmToToken(args.token, args.payload);
    if (result.ok) return { ok: true };
    if (result.error === "fcm_not_configured") {
      return { ok: false, skipped: "fcm_not_configured" };
    }
    return { ok: false, error: result.error };
  }

  return { ok: false, skipped: "apns_not_configured" };
}

/**
 * 依 userId 查所有裝置並發送（註解：業務層呼叫）。
 */
export async function sendPushToUserDevices(userId: string, payload: PushNotificationPayload) {
  const prisma = getPrisma();
  const devices = await prisma.pushDevice.findMany({ where: { userId } });

  let sent = 0;
  const errors: string[] = [];

  for (const device of devices) {
    const result = await sendPushToDevice({
      token: device.token,
      platform: device.platform,
      payload,
    });
    if (result.ok) {
      sent += 1;
    } else if (result.error) {
      errors.push(result.error);
    }
  }

  if (devices.length === 0) {
    return { sent: 0, total: 0, skipped: "no_devices" as const };
  }

  if (sent === 0 && errors.length === 0) {
    return { sent: 0, total: devices.length, skipped: "fcm_not_configured" as const };
  }

  return { sent, total: devices.length, errors: errors.length > 0 ? errors : undefined };
}
