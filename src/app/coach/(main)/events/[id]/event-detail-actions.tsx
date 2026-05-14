"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  eventId: string;
  /** 由伺服端計算，避免 client import Prisma enum（註解）。 */
  isDraft: boolean;
};

/** 發布事件（註解：草稿 → 已發布）。 */
export function EventPublishButton({ eventId, isDraft }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isDraft) {
    return (
      <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800">已發布</span>
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
