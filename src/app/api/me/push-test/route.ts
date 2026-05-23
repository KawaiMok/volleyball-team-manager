import { isFcmConfigured } from "@/lib/push/fcm";
import { buildPushPayload } from "@/lib/push/kinds";
import { recordUserNotification } from "@/lib/push/record-notification";
import { sendPushToUserDevices } from "@/lib/push/send";
import { isPushTestAccessEnabled } from "@/lib/push-test-access";
import { getOrSyncPrismaUserFromClerk, getTeamMember } from "@/lib/session";
import { NextResponse } from "next/server";

/**
 * 對目前帳號已註冊裝置發送測試推播（註解：須已設定 Firebase Admin 且 App 已上傳 token）。
 */
export async function POST() {
  if (!isPushTestAccessEnabled()) {
    return NextResponse.json({ error: "推播測試未開放（正式環境已關閉）" }, { status: 403 });
  }

  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  if (!isFcmConfigured()) {
    return NextResponse.json(
      { error: "伺服端尚未設定 FCM（FIREBASE_* 環境變數）" },
      { status: 503 },
    );
  }

  const member = await getTeamMember();
  const payload = buildPushPayload({
    kind: "push_test",
    teamId: member?.teamId ?? "unknown",
  });
  await recordUserNotification(user.id, payload);
  const result = await sendPushToUserDevices(user.id, payload);

  return NextResponse.json(result);
}
