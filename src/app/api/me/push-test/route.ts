import { isFcmConfigured } from "@/lib/push/fcm";
import { buildPushPayload } from "@/lib/push/kinds";
import { sendPushToUserDevices } from "@/lib/push/send";
import { getOrSyncPrismaUserFromClerk, getTeamMember } from "@/lib/session";
import { NextResponse } from "next/server";

/**
 * 對目前帳號已註冊裝置發送測試推播（註解：須已設定 Firebase Admin 且 App 已上傳 token）。
 */
export async function POST() {
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
  const result = await sendPushToUserDevices(
    user.id,
    buildPushPayload({
      kind: "push_test",
      teamId: member?.teamId ?? "unknown",
    }),
  );

  return NextResponse.json(result);
}
