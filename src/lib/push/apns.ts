import { createSign } from "node:crypto";
import * as http2 from "node:http2";

import type { PushNotificationPayload } from "@/lib/push/types";

/** APNs JWT 快取（註解：Apple 建議最長 1 小時，此處 50 分鐘刷新） */
let cachedJwt: { token: string; expiresAt: number } | null = null;

type ApnsConfig = {
  keyId: string;
  teamId: string;
  privateKey: string;
  bundleId: string;
  useSandbox: boolean;
};

/**
 * 從環境變數解析 APNs 設定（註解：.p8 金鑰勿提交 git）。
 */
function resolveApnsConfig(): ApnsConfig | null {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const bundleId = process.env.APNS_BUNDLE_ID ?? "com.volleyball.teammanager";

  if (!keyId || !teamId || !privateKey) {
    return null;
  }

  const useSandbox =
    process.env.APNS_USE_SANDBOX === "true" ||
    (process.env.APNS_USE_SANDBOX !== "false" && process.env.NODE_ENV !== "production");

  return { keyId, teamId, privateKey, bundleId, useSandbox };
}

export function isApnsConfigured(): boolean {
  return resolveApnsConfig() !== null;
}

/** 診斷用：回傳 APNs 是否就緒及 sandbox／production 端點（註解：Xcode Debug 須對應 sandbox）。 */
export function getApnsDiagnostics(): {
  configured: boolean;
  useSandbox: boolean;
  bundleId: string;
} {
  const config = resolveApnsConfig();
  return {
    configured: config !== null,
    useSandbox: config?.useSandbox ?? false,
    bundleId: config?.bundleId ?? "com.volleyball.teammanager",
  };
}

/** 建立 ES256 JWT（註解：供 APNs HTTP/2 Authorization header 使用） */
function createApnsJwt(config: ApnsConfig): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && cachedJwt.expiresAt > now) {
    return cachedJwt.token;
  }

  const header = Buffer.from(JSON.stringify({ alg: "ES256", kid: config.keyId })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ iss: config.teamId, iat: now })).toString("base64url");
  const signingInput = `${header}.${payload}`;

  const sign = createSign("SHA256");
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign({ key: config.privateKey, dsaEncoding: "ieee-p1363" }).toString("base64url");

  const token = `${signingInput}.${signature}`;
  cachedJwt = { token, expiresAt: now + 50 * 60 };
  return token;
}

/** 組裝 APNs payload（註解：自訂 data 放根層，Capacitor 會映射到 notification.data） */
function buildApnsBody(payload: PushNotificationPayload): string {
  const body: Record<string, unknown> = {
    aps: {
      alert: {
        title: payload.title,
        body: payload.body,
      },
      sound: "default",
    },
  };

  if (payload.data) {
    for (const [key, value] of Object.entries(payload.data)) {
      body[key] = value;
    }
  }

  return JSON.stringify(body);
}

/**
 * 經 APNs HTTP/2 發送至單一 iOS device token。
 */
export async function sendApnsToToken(
  token: string,
  payload: PushNotificationPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const config = resolveApnsConfig();
  if (!config) {
    return { ok: false, error: "apns_not_configured" };
  }

  const host = config.useSandbox ? "api.sandbox.push.apple.com" : "api.push.apple.com";
  const jwt = createApnsJwt(config);
  const apnsBody = buildApnsBody(payload);

  return new Promise((resolve) => {
    const client = http2.connect(`https://${host}`);

    client.on("error", (err) => {
      client.close();
      resolve({ ok: false, error: err.message });
    });

    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${token}`,
      authorization: `bearer ${jwt}`,
      "apns-topic": config.bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
    });

    let responseBody = "";
    req.on("response", (headers) => {
      const status = headers[":status"];
      req.on("data", (chunk) => {
        responseBody += chunk.toString();
      });
      req.on("end", () => {
        client.close();
        if (status === 200) {
          resolve({ ok: true });
          return;
        }
        let reason = `apns_http_${status}`;
        try {
          const parsed = JSON.parse(responseBody) as { reason?: string };
          if (parsed.reason) reason = parsed.reason;
        } catch {
          // 保留預設 reason
        }
        resolve({ ok: false, error: reason });
      });
    });

    req.on("error", (err) => {
      client.close();
      resolve({ ok: false, error: err.message });
    });

    req.end(apnsBody);
  });
}
