"use client";

import { useEffect } from "react";

import {
  applyDomTheme,
  getThemePreference,
  subscribeThemePreference,
} from "@/lib/theme-preference";

/** 掛載時同步主題、聽「跟隨系統」時的 media change（註解：與 toolbar 同一套邏輯）。 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyDomTheme(getThemePreference());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => {
      if (getThemePreference() === "system") {
        applyDomTheme("system");
      }
    };
    mq.addEventListener("change", onMq);
    const unsub = subscribeThemePreference(() => {
      applyDomTheme(getThemePreference());
    });
    return () => {
      mq.removeEventListener("change", onMq);
      unsub();
    };
  }, []);

  return children;
}
