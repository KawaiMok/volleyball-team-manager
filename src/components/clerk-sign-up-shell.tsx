"use client";

import { SignUp } from "@clerk/nextjs";
import { useMemo } from "react";

import { useCapacitorNative } from "@/hooks/use-capacitor-native";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

type Props = {
  fallbackRedirectUrl: string;
};

/**
 * 註冊表單（註解：App 內隱藏 OAuth，與登入相同）。
 */
export function ClerkSignUpShell({ fallbackRedirectUrl }: Props) {
  const native = useCapacitorNative();
  const appearance = useMemo(() => clerkAuthAppearance(native), [native]);

  return (
    <>
      {native ?
        <p className="mx-auto mb-4 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          手機 App 請使用 <strong>Email 與密碼</strong> 註冊；Google 等第三方在 App 內無法使用。
        </p>
      : null}
      <SignUp fallbackRedirectUrl={fallbackRedirectUrl} appearance={appearance} />
    </>
  );
}
