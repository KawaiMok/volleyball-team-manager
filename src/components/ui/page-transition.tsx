"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

import { useCapacitorNative } from "@/hooks/use-capacitor-native";

type Props = {
  children: React.ReactNode;
};

const NativePageTransition = dynamic(
  () =>
    import("@/components/ui/page-transition-motion").then((m) => m.NativePageTransition),
  { ssr: false },
);

/**
 * App Router 頁面轉場（註解：僅 Capacitor 原生殼載入 motion；Web 直接渲染子節點）。
 */
export function PageTransition({ children }: Props) {
  const native = useCapacitorNative();
  const pathname = usePathname() ?? "";

  if (!native) {
    return (
      <div key={pathname} className="min-h-0">
        {children}
      </div>
    );
  }

  return <NativePageTransition>{children}</NativePageTransition>;
}
