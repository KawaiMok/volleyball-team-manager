"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useEffect, useRef } from "react";

import { CIYOU } from "@/lib/ciyou-colors";
import { hapticLight } from "@/lib/haptics";
import { useToast } from "@/components/toast-provider";

/** 依 html class 同步 StatusBar（註解：含慈幼藍品牌底） */
async function syncStatusBar() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const root = document.documentElement;
    const ciyou = root.classList.contains("theme-ciyou");
    const dark = !ciyou && root.classList.contains("dark");
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    const bg = ciyou ? CIYOU.pageBg : dark ? "#09090b" : "#ffffff";
    await StatusBar.setBackgroundColor({ color: bg });
  } catch {
    /** iOS 可能不支援 setBackgroundColor */
  }
}

/** 兩次返回鍵間隔（註解：Android 常見「再按一次退出」）。 */
const EXIT_CONFIRM_MS = 2000;

/**
 * Capacitor 原生橋接（註解：StatusBar、Android 返回鍵、主題同步）。
 */
export function CapacitorNativeBridge() {
  const { showHint } = useToast();
  const lastExitPromptAtRef = useRef(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void syncStatusBar();

    const observer = new MutationObserver(() => {
      void syncStatusBar();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    /** Android 返回鍵：不瀏覽上一頁，改為雙擊退出 App（註解：與 Web history 脫鉤）。 */
    const backSub = App.addListener("backButton", () => {
      const now = Date.now();
      if (now - lastExitPromptAtRef.current < EXIT_CONFIRM_MS) {
        lastExitPromptAtRef.current = 0;
        void App.minimizeApp();
        return;
      }

      lastExitPromptAtRef.current = now;
      void hapticLight();
      showHint("再按一次返回鍵退出 App");
    });

    return () => {
      observer.disconnect();
      void backSub.then((h) => h.remove());
    };
  }, [showHint]);

  return null;
}
