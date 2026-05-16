"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  eventId: string;
  /** 由伺服端計算，避免 client import Prisma enum（註解）。 */
  isDraft: boolean;
};

/** 發布事件（註解：草稿 → 已發布；已發布時僅顯示綠色圓點）。 */
export function EventPublishButton({ eventId, isDraft }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setError(null);
    setPending(true);
    const res = await fetch(`/api/events/${eventId}/publish`, {
      method: "PATCH",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? "發布失敗");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={() => void publish()}
        disabled={pending}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {pending ? "發布中…" : "發布給球員"}
      </button>
    </div>
  );
}
