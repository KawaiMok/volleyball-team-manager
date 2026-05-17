"use client";

import { useEffect, useState } from "react";

/**
 * 是否於 Capacitor 原生殼內（註解：僅 client；SSR 為 false）。
 */
function readNativeFromWindow(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return cap?.isNativePlatform?.() === true;
}

export function useCapacitorNative(): boolean {
  const [native, setNative] = useState(readNativeFromWindow);

  useEffect(() => {
    void import("@capacitor/core").then(({ Capacitor }) => {
      setNative(Capacitor.isNativePlatform());
    });
  }, []);

  return native;
}
