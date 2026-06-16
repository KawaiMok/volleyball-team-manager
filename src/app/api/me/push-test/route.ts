import { MemberStatus } from "@/generated/prisma/client";
import { getApnsDiagnostics, isApnsConfigured } from "@/lib/push/apns";
import { isFcmConfigured } from "@/lib/push/fcm";
import { buildPushPayload } from "@/lib/push/kinds";
import { recordUserNotification } from "@/lib/push/record-notification";
import { sendPushToUserDevices } from "@/lib/push/send";
import { isPushTestAccessEnabled } from "@/lib/push-test-access";
import { getPrisma } from "@/lib/prisma";
import { getOrSyncPrismaUserFromClerk } from "@/lib/session";
import { NextResponse } from "next/server";

/**
 * 對目前帳號已註冊裝置發送測試推播（註解：須已設定 FCM 或 APNs，且 App 已上傳 token）。
 */
export async function POST() {
  if (!isPushTestAccessEnabled()) {
    return NextResponse.json(
      {
        error: "推播測試未開放（正式環境預設關閉）",
        hint: "於 Vercel 設 ALLOW_PUSH_TEST=1 後 redeploy",
      },
      { status: 403 },
    );
  }

  const user = await getOrSyncPrismaUserFromClerk();
  if (!user) {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  if (!isFcmConfigured() && !isApnsConfigured()) {
    return NextResponse.json(
      { error: "伺服端尚未設定推播（FIREBASE_* 或 APNS_* 環境變數）" },
      { status: 503 },
    );
  }

  const prisma = getPrisma();
  const devices = await prisma.pushDevice.findMany({ where: { userId: user.id } });
  const deviceCounts = {
    ios: devices.filter((d) => d.platform === "IOS").length,
    android: devices.filter((d) => d.platform === "ANDROID").length,
  };

  const member = await prisma.teamMember.findFirst({
    where: { userId: user.id, status: MemberStatus.ACTIVE },
  });
  const teamId = member?.teamId ?? "none";

  const payload = buildPushPayload({
    kind: "push_test",
    teamId,
  });
  await recordUserNotification(user.id, payload);
  const result = await sendPushToUserDevices(user.id, payload);

  return NextResponse.json({
    ...result,
    diagnostics: {
      nativePushBridgeEnabled: process.env.NEXT_PUBLIC_ENABLE_NATIVE_PUSH === "true",
      apns: getApnsDiagnostics(),
      fcmConfigured: isFcmConfigured(),
      deviceCounts,
      hint:
        deviceCounts.ios > 0 && getApnsDiagnostics().configured && !getApnsDiagnostics().useSandbox
          ? "Xcode Debug 裝的 App 須設 APNS_USE_SANDBOX=true"
          : undefined,
    },
  });
}
