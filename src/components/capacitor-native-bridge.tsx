"use client";

import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { setNavDirection } from "@/hooks/use-navigation-direction";

/** 依 html.dark 同步 StatusBar 樣式 */
async function syncStatusBar() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const dark = document.documentElement.classList.contains("dark");
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: dark ? "#09090b" : "#ffffff" });
  } catch {
    /** iOS 可能不支援 setBackgroundColor */
  }
}

/**
 * Capacitor 原生橋接（註解：StatusBar、Android 返回鍵、主題同步）。
 */
export function CapacitorNativeBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void syncStatusBar();

    const observer = new MutationObserver(() => {
      void syncStatusBar();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    const backSub = App.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        setNavDirection("back");
        router.back();
      } else {
        void App.minimizeApp();
      }
    });

    return () => {
      observer.disconnect();
      void backSub.then((h) => h.remove());
    };
  }, [router]);

  return null;
}
