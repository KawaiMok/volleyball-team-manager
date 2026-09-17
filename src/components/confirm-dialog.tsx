"use client";

import type { ReactNode } from "react";

import { InlineSpinner } from "@/components/inline-spinner";
import { BottomSheet } from "@/components/ui/bottom-sheet";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 危險操作（註解：刪除等用紅色確認鈕）。 */
  variant?: "default" | "danger";
  pending?: boolean;
};

/** 確認對話框（註解：手機 BottomSheet、桌面 modal）。 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  subtitle,
  children,
  confirmLabel = "確定",
  cancelLabel = "取消",
  variant = "default",
  pending = false,
}: Props) {
  const confirmClass =
    variant === "danger" ?
      "bg-rose-700 text-white hover:bg-rose-800"
    : "bg-[var(--brand-primary)] text-white hover:opacity-90";

  return (
    <BottomSheet
      open={open}
      onClose={pending ? () => {} : onClose}
      title={title}
      subtitle={subtitle}
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className={`flex flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50 ${confirmClass}`}
          >
            {pending ? <InlineSpinner /> : confirmLabel}
          </button>
        </div>
      }
    >
      <div className="text-sm text-zinc-600 dark:text-zinc-400">{children}</div>
    </BottomSheet>
  );
}
