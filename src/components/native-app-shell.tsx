"use client";

import { AppBottomNav, NativeAppContentPad } from "@/components/app-bottom-nav";

type Props = {
  children: React.ReactNode;
  surface: "coach" | "player";
};

/** 原生 App 外殼：底部選單 + 內容底部留白（註解：Web 瀏覽器不顯示）。 */
export function NativeAppShell({ children, surface }: Props) {
  return (
    <>
      <NativeAppContentPad>{children}</NativeAppContentPad>
      <AppBottomNav surface={surface} />
    </>
  );
}
