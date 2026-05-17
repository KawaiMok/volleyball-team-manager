"use client";

import { SignIn } from "@clerk/nextjs";
import { useMemo } from "react";

import { useCapacitorNative } from "@/hooks/use-capacitor-native";
import { clerkAuthAppearance } from "@/lib/clerk-appearance";

type Props = {
  fallbackRedirectUrl: string;
  rootBoxClassName?: string;
};

/**
 * 登入表單（註解：App 內隱藏 Google 等 OAuth，僅 Email／密碼）。
 */
export function ClerkSignInShell({ fallbackRedirectUrl, rootBoxClassName }: Props) {
  const native = useCapacitorNative();
  const appearance = useMemo(() => {
    const base = clerkAuthAppearance(native);
    if (!rootBoxClassName || !base.elements) return base;
    return {
      ...base,
      elements: {
        ...base.elements,
        rootBox: `${String(base.elements.rootBox ?? "mx-auto")} ${rootBoxClassName}`.trim(),
      },
    };
  }, [native, rootBoxClassName]);

  return (
    <>
      {native ?
        <p className="mx-auto mb-4 max-w-md rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          手機 App 請使用 <strong>Email 與密碼</strong> 登入；Google 等第三方登入在 App 內無法使用。
        </p>
      : null}
      <SignIn fallbackRedirectUrl={fallbackRedirectUrl} appearance={appearance} />
    </>
  );
}
