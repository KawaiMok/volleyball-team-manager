import type { App } from "firebase-admin/app";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

import type { PushNotificationPayload } from "@/lib/push/types";

let firebaseApp: App | null | undefined;

/**
 * 從環境變數建立 Firebase Admin（註解：Vercel 建議用三欄位；本機可用整段 JSON）。
 */
function resolveFirebaseApp(): App | null {
  if (firebaseApp !== undefined) {
    return firebaseApp;
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      const parsed = JSON.parse(json) as {
        project_id: string;
        client_email: string;
        private_key: string;
      };
      firebaseApp =
        getApps()[0] ??
        initializeApp({
          credential: cert({
            projectId: parsed.project_id,
            clientEmail: parsed.client_email,
            privateKey: parsed.private_key,
          }),
        });
      return firebaseApp;
    } catch {
      firebaseApp = null;
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    firebaseApp = null;
    return null;
  }

  firebaseApp =
    getApps()[0] ??
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  return firebaseApp;
}

export function isFcmConfigured(): boolean {
  return resolveFirebaseApp() !== null;
}

/**
 * 經 FCM 發送至單一 Android token（註解：iOS 須另接 APNs）。
 */
export async function sendFcmToToken(
  token: string,
  payload: PushNotificationPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const app = resolveFirebaseApp();
  if (!app) {
    return { ok: false, error: "fcm_not_configured" };
  }

  try {
    await getMessaging(app).send({
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data ?? {},
      android: {
        priority: "high",
      },
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "fcm_send_failed";
    return { ok: false, error: message };
  }
}
