import { getPrisma } from "@/lib/prisma";
import type { PushNotificationPayload } from "@/lib/push/types";

/**
 * 寫入使用者通知紀錄（註解：與 FCM 並行；即使無裝置 token 仍可在 App 內查看）。
 */
export async function recordUserNotification(userId: string, payload: PushNotificationPayload) {
  const prisma = getPrisma();
  const data = payload.data ?? {};
  const teamIdRaw = data.teamId?.trim();
  const teamId = teamIdRaw && teamIdRaw !== "unknown" ? teamIdRaw : null;

  await prisma.userNotification.create({
    data: {
      userId,
      teamId,
      kind: data.type?.trim() || "unknown",
      title: payload.title.slice(0, 200),
      body: payload.body.slice(0, 500),
      path: data.path?.trim() || null,
    },
  });
}
