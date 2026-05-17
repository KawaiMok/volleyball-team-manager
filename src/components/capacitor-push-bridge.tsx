"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef } from "react";

import { isNativePushBridgeEnabled } from "@/lib/native-push-enabled";

/**
 * 僅在 Capacitor 原生殼內註冊推播並將 token 同步至 `/api/me/push-token`（註解：預設關閉，見 `NEXT_PUBLIC_ENABLE_NATIVE_PUSH`）。
 */
export function CapacitorPushBridge() {
  const { isSignedIn, isLoaded } = useAuth();
  const syncedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isNativePushBridgeEnabled()) return;

    let cancelled = false;
    const teardown: { current?: () => void } = {};

    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (cancelled || !Capacitor.isNativePlatform()) return;

        const { PushNotifications } = await import("@capacitor/push-notifications");

        const perm = await PushNotifications.requestPermissions();
        if (cancelled || perm.receive !== "granted") return;

        const platform =
          Capacitor.getPlatform() === "ios"
            ? "ios"
            : Capacitor.getPlatform() === "android"
              ? "android"
              : null;
        if (!platform) return;

        const sub = await PushNotifications.addListener("registration", async (ev) => {
          const token = ev.value;
          if (!token || cancelled) return;
          if (syncedTokenRef.current === token) return;
          syncedTokenRef.current = token;
          try {
            await fetch("/api/me/push-token", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, platform }),
            });
          } catch {
            syncedTokenRef.current = null;
          }
        });

        const errSub = await PushNotifications.addListener("registrationError", () => {
          syncedTokenRef.current = null;
        });

        await PushNotifications.register();

        teardown.current = () => {
          void sub.remove();
          void errSub.remove();
        };
      } catch {
        /** 註解：未設定 FCM 等情況下避免未處理錯誤；原生層閃退仍須關閉 `NEXT_PUBLIC_ENABLE_NATIVE_PUSH`。 */
      }
    })();

    return () => {
      cancelled = true;
      teardown.current?.();
    };
  }, [isLoaded, isSignedIn]);

  return null;
}
