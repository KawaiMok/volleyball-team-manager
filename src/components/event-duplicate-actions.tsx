"use client";

import { useToast } from "@/components/toast-provider";
import { InlineSpinner } from "@/components/inline-spinner";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DuplicateOneProps = {
  eventId: string;
  /** 平移天數（註解：預設 7）。 */
  shiftDays?: number;
  /** 按鈕文案 */
  label?: string;
  className?: string;
};

/** 複製單一事件（註解：成功後導向新草稿詳情）。 */
export function EventDuplicateButton({
  eventId,
  shiftDays = 7,
  label = "複製（+7 天）",
  className,
}: DuplicateOneProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/duplicate`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftDays }),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok) {
        showError(data.error ?? `複製失敗 (${res.status})`);
        return;
      }
      showSuccess("已建立複製草稿，請確認時間後發布");
      router.push(`/coach/events/${data.id}`);
      router.refresh();
    } catch {
      showError("網路錯誤");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={pending}
      className={
        className ??
        "inline-flex min-h-[2.5rem] items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      }
      aria-busy={pending}
    >
      {pending ? <InlineSpinner /> : label}
    </button>
  );
}

type CopyLastTrainingProps = {
  shiftDays?: number;
  className?: string;
};

/** 複製最近一場訓練（註解：事件列表／新增頁快捷）。 */
export function CopyLastTrainingButton({ shiftDays = 7, className }: CopyLastTrainingProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      const res = await fetch("/api/events/copy-last-training", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shiftDays }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
        sourceTitle?: string;
      };
      if (!res.ok) {
        showError(data.error ?? `複製失敗 (${res.status})`);
        return;
      }
      const hint = data.sourceTitle ? `（來源：${data.sourceTitle}）` : "";
      showSuccess(`已複製上週訓練為新草稿${hint}`);
      router.push(`/coach/events/${data.id}`);
      router.refresh();
    } catch {
      showError("網路錯誤");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onClick()}
      disabled={pending}
      className={
        className ??
        "inline-flex min-h-[2.5rem] items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      }
      aria-busy={pending}
    >
      {pending ? <InlineSpinner /> : "複製上週訓練"}
    </button>
  );
}
