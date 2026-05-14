"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  eventId: string;
  /** 目前 RSVP（註解：UNANSWERED 時表單為預設未選）。 */
  initialRsvp: "YES" | "NO" | "MAYBE" | "UNANSWERED";
  initialReason: string | null;
  disabled?: boolean;
  /** 鎖定原因（註解：截止時間與其他情境文案不同）。 */
  disabledReason?: "deadline";
};

/** 球員 RSVP 表單（註解：呼叫 PATCH /api/events/[id]/rsvp）。 */
export function PlayerRsvpForm({
  eventId,
  initialRsvp,
  initialReason,
  disabled = false,
  disabledReason,
}: Props) {
  const router = useRouter();
  const [rsvpStatus, setRsvpStatus] = useState<"YES" | "NO" | "MAYBE">(
    initialRsvp === "UNANSWERED" ? "YES" : initialRsvp,
  );
  const [reason, setReason] = useState(initialReason ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const res = await fetch(`/api/events/${eventId}/rsvp`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rsvpStatus,
        rsvpReason: reason.trim() || null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      setError((data as { error?: string }).error ?? `失敗 (${res.status})`);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">出席意願（RSVP）</h3>
      <fieldset disabled={disabled || pending} className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="rsvp"
            checked={rsvpStatus === "YES"}
            onChange={() => setRsvpStatus("YES")}
          />
          會到
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="rsvp"
            checked={rsvpStatus === "MAYBE"}
            onChange={() => setRsvpStatus("MAYBE")}
          />
          不一定
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name="rsvp"
            checked={rsvpStatus === "NO"}
            onChange={() => setRsvpStatus("NO")}
          />
          不到
        </label>
      </fieldset>
      <label className="block text-xs text-slate-600">
        備註（選填）
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="例如：可能晚到 15 分鐘"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={disabled || pending}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "送出中…" : "更新 RSVP"}
      </button>
      {disabled ?
        <p className="text-xs text-slate-500">
          {disabledReason === "deadline" ?
            "已超過 RSVP 截止時間，無法再變更出席意願；若有異動請洽教練／隊務。"
          : "目前已鎖定 RSVP（逾時或已由隊務處理時請洽教練）。"}
        </p>
      : null}
    </form>
  );
}
