"use client";
import { useToast } from "@/components/toast-provider";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Row = {
  memberId: string;
  displayName: string;
  rsvpStatus: string;
  rsvpReason: string | null;
  checkedIn: boolean;
};

type Props = {
  eventId: string;
  rows: Row[];
};

/** 點名：批次更新 checkedIn（註解：依 RSVP 一鍵全到）。 */
export function AttendanceTable({ eventId, rows }: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [local, setLocal] = useState(() =>
    rows.reduce<Record<string, boolean>>((acc, r) => {
      acc[r.memberId] = r.checkedIn;
      return acc;
    }, {}),
  );
  const [pending, setPending] = useState(false);

  const updatesPayload = useMemo(
    () => rows.map((r) => ({ memberId: r.memberId, checkedIn: local[r.memberId] ?? false })),
    [rows, local],
  );

  async function save() {
    setPending(true);
    const res = await fetch(`/api/events/${eventId}/check-in`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: updatesPayload }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      showError((data as { error?: string }).error ?? "儲存失敗");
      return;
    }
    showSuccess("已儲存點名");
    router.refresh();
  }

  function markAllPresent() {
    const next = { ...local };
    for (const r of rows) next[r.memberId] = true;
    setLocal(next);
  }

  function markYesPresent() {
    const next = { ...local };
    for (const r of rows) {
      if (r.rsvpStatus === "YES") next[r.memberId] = true;
    }
    setLocal(next);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={markAllPresent}
          className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs hover:bg-zinc-50 dark:bg-zinc-950"
        >
          全部勾選實到
        </button>
        <button
          type="button"
          onClick={markYesPresent}
          className="rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs hover:bg-zinc-50 dark:bg-zinc-950"
        >
          RSVP「出席」視為實到
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={pending}
          className="rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "儲存中…" : "儲存點名"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
            <tr>
              <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">姓名</th>
              <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">RSVP</th>
              <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">原因</th>
              <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">實到</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
              <tr key={r.memberId}>
                <td className="px-3 py-2">{r.displayName}</td>
                <td className="px-3 py-2 tabular-nums text-zinc-700 dark:text-zinc-300">{r.rsvpStatus}</td>
                <td className="max-w-[200px] truncate px-3 py-2 text-zinc-600 dark:text-zinc-400">{r.rsvpReason ?? "—"}</td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={local[r.memberId] ?? false}
                    onChange={(e) =>
                      setLocal((prev) => ({
                        ...prev,
                        [r.memberId]: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
