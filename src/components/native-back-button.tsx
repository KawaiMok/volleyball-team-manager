"use client";

import { useRouter } from "next/navigation";

import { setNavDirection } from "@/hooks/use-navigation-direction";

type Props = {
  label?: string;
  className?: string;
};

/** 原生詳情頁返回按鈕（註解：觸發 stack-pop 轉場） */
export function NativeBackButton({ label = "返回", className = "" }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={`inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-[var(--brand-primary)] active:opacity-70 ${className}`.trim()}
      onClick={() => {
        setNavDirection("back");
        router.back();
      }}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M15 6l-6 6 6 6" />
      </svg>
      {label}
    </button>
  );
}
