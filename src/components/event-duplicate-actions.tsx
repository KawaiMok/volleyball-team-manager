"use client";

import { useToast } from "@/components/toast-provider";
import { InlineSpinner } from "@/components/inline-spinner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ServiceHubEntry } from "@/components/service-hub-entry";

import { useRouter } from "next/navigation";
import { useState } from "react";

type DuplicateOneProps = {
  eventId: string;
  /** 用於確認 popup 文案（註解：建議傳入事件標題）。 */
  eventTitle?: string;
  /** 平移天數（註解：預設 7）。 */
  shiftDays?: number;
  /** 按鈕文案 */
  label?: string;
  className?: string;
};

/** 複製單一事件（註解：確認後建立新草稿並導向詳情）。 */
export function EventDuplicateButton({
  eventId,
  eventTitle,
  shiftDays = 7,
  label = "複製（+7 天）",
  className,
}: DuplicateOneProps) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function runDuplicate() {
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
      setConfirmOpen(false);
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
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={pending}
        className={
          className ??
          "inline-flex min-h-[2.5rem] items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        }
        aria-busy={pending}
      >
        {pending ? <InlineSpinner /> : label}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void runDuplicate()}
        title="複製事件"
        subtitle={eventTitle ? `「${eventTitle}」` : undefined}
        confirmLabel="複製"
        pending={pending}
      >
        <p>
          將建立<strong className="font-medium text-zinc-800 dark:text-zinc-200">新草稿</strong>
          ，時間 +{shiftDays} 天。
        </p>
        <p className="mt-2">
          會複製參與者、訓練計畫、企位與戰術／影片連結；不含 RSVP、留言、比賽結果或體能成績。
        </p>
      </ConfirmDialog>
    </>
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

const COPY_TRAINING_ICON = (
  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path strokeLinecap="round" d="M4 16V6a2 2 0 012-2h10" />
  </svg>
);

/** 複製上週訓練 — logo 入口（註解：事件列表 hub 用）。 */
export function CopyLastTrainingHubEntry({ shiftDays = 7 }: { shiftDays?: number }) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [pending, setPending] = useState(false);

  async function runCopy() {
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
    <ServiceHubEntry
      label="複製訓練"
      icon={pending ? <InlineSpinner className="h-6 w-6" /> : COPY_TRAINING_ICON}
      onClick={() => void runCopy()}
      disabled={pending}
    />
  );
}
