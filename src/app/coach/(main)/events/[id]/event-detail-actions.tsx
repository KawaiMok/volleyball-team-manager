"use client";
import { useToast } from "@/components/toast-provider";
import { InlineSpinner } from "@/components/inline-spinner";
import { useRefreshThen } from "@/lib/use-refresh-then";
import { EventDuplicateButton } from "@/components/event-duplicate-actions";
import { ConfirmDialog } from "@/components/confirm-dialog";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  eventId: string;
  /** 由伺服端計算，避免 client import Prisma enum（註解）。 */
  isDraft: boolean;
};

/** 發布事件（註解：草稿 → 已發布；已發布時僅顯示綠色圓點）。 */
export function EventPublishButton({ eventId, isDraft }: Props) {
  const { showError, showSuccess } = useToast();
  const { refreshThen, isRefreshing } = useRefreshThen();
  const [pending, setPending] = useState(false);
  const busy = pending || isRefreshing;

  if (!isDraft) {
    return (
      <span
        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 align-middle"
        role="img"
        aria-label="已發布"
        title="已發布"
      />
    );
  }

  async function publish() {
    setPending(true);
    const res = await fetch(`/api/events/${eventId}/publish`, {
      method: "PATCH",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      showError((data as { error?: string }).error ?? "發布失敗");
      return;
    }
    refreshThen(() => showSuccess("已發布給球員"));
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => void publish()}
        disabled={busy}
        className="inline-flex min-h-[2.5rem] min-w-[7rem] items-center justify-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        aria-busy={busy}
      >
        {busy ?
          <InlineSpinner />
        : "發布給球員"}
      </button>
    </div>
  );
}

/** 刪除事件（註解：popup 確認；成功後回事件列表）。 */
export function EventDeleteButton({
  eventId,
  eventTitle,
  isPublished,
}: {
  eventId: string;
  eventTitle: string;
  isPublished: boolean;
}) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function runDelete() {
    setPending(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        showError(data.error ?? `刪除失敗 (${res.status})`);
        return;
      }
      setConfirmOpen(false);
      showSuccess("已刪除事件");
      router.push("/coach/events");
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
        className="inline-flex min-h-[2.5rem] items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-60 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200 dark:hover:bg-rose-950/70"
        aria-busy={pending}
      >
        {pending ? <InlineSpinner /> : "刪除"}
      </button>
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void runDelete()}
        title="刪除事件"
        subtitle={`「${eventTitle}」`}
        confirmLabel="刪除"
        variant="danger"
        pending={pending}
      >
        {isPublished ?
          <p>
            已發布事件刪除後<strong className="font-medium text-rose-800 dark:text-rose-300">無法復原</strong>
            ，點名、回饋、比賽結果、體能數據等也會一併移除。
          </p>
        : <p>刪除草稿後無法復原，確定要繼續嗎？</p>}
      </ConfirmDialog>
    </>
  );
}

/** 頁首操作列：複製、刪除在發布左側（註解：避免與發布並排誤觸時仍保持視覺區隔）。 */
export function EventDetailHeaderActions({
  eventId,
  eventTitle,
  isDraft,
  isPublished,
  isCancelled,
}: {
  eventId: string;
  eventTitle: string;
  isDraft: boolean;
  isPublished: boolean;
  isCancelled: boolean;
}) {
  const secondaryBtn =
    "inline-flex min-h-[2.5rem] items-center justify-center rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {!isCancelled ?
        <EventDuplicateButton
          eventId={eventId}
          eventTitle={eventTitle}
          label="複製"
          className={secondaryBtn}
        />
      : null}
      <EventDeleteButton eventId={eventId} eventTitle={eventTitle} isPublished={isPublished} />
      <EventPublishButton eventId={eventId} isDraft={isDraft} />
    </div>
  );
}
