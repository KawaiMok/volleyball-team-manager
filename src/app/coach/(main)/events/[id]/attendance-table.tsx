"use client";
import { useToast } from "@/components/toast-provider";
import {
  RsvpStatusIndicator,
  RsvpStatusLegend,
  rsvpStatusLabelZh,
} from "@/components/domain-status-indicators";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { formatDateTimeZh } from "@/lib/format-datetime";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Row = {
  memberId: string;
  displayName: string;
  rsvpStatus: string;
  rsvpReason: string | null;
  rsvpAtIso: string | null;
  checkedIn: boolean;
};

type Props = {
  eventId: string;
  rows: Row[];
  /** 已發布事件才顯示「催回覆」（註解：草稿／取消不推播）。 */
  isPublished: boolean;
};

/** 點名：RSVP 色點、實到勾選、詳情 sheet、催回覆推播。 */
export function AttendanceTable({ eventId, rows, isPublished }: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [local, setLocal] = useState(() =>
    rows.reduce<Record<string, boolean>>((acc, r) => {
      acc[r.memberId] = r.checkedIn;
      return acc;
    }, {}),
  );
  const [pending, setPending] = useState(false);
  const [remindPending, setRemindPending] = useState(false);
  const [detailRow, setDetailRow] = useState<Row | null>(null);

  const unansweredCount = useMemo(
    () => rows.filter((r) => r.rsvpStatus === "UNANSWERED").length,
    [rows],
  );

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

  async function remindUnanswered() {
    if (unansweredCount === 0) {
      showError("所有參與者皆已回覆");
      return;
    }
    setRemindPending(true);
    const res = await fetch(`/api/events/${eventId}/rsvp-remind`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    setRemindPending(false);
    if (!res.ok) {
      showError((data as { error?: string }).error ?? "催回覆失敗");
      return;
    }
    const reminded = (data as { reminded?: number }).reminded ?? 0;
    if (reminded === 0) {
      showSuccess("所有參與者皆已回覆");
      return;
    }
    showSuccess(`已推播催回覆給 ${reminded} 位球員`);
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <RsvpStatusLegend />
        {isPublished && unansweredCount > 0 ?
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            未回覆 {unansweredCount} 人
          </span>
        : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={markAllPresent}
          className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-950"
        >
          全部勾選實到
        </button>
        <button
          type="button"
          onClick={markYesPresent}
          className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-950"
        >
          RSVP「出席」視為實到
        </button>
        {isPublished ?
          <button
            type="button"
            onClick={() => void remindUnanswered()}
            disabled={remindPending || unansweredCount === 0}
            className="rounded border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100 disabled:opacity-50 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60"
          >
            {remindPending ? "推播中…" : "催回覆 RSVP"}
          </button>
        : null}
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
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
            <tr>
              <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">姓名</th>
              <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">RSVP</th>
              <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">實到</th>
              <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                <span className="sr-only">詳情</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.memberId}>
                <td className="px-3 py-2">{r.displayName}</td>
                <td className="px-3 py-2">
                  <RsvpStatusIndicator status={r.rsvpStatus} />
                </td>
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
                    aria-label={`${r.displayName} 實到`}
                  />
                </td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => setDetailRow(r)}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    詳情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BottomSheet
        open={detailRow !== null}
        onClose={() => setDetailRow(null)}
        title={detailRow?.displayName ?? "RSVP 詳情"}
        subtitle="出席意願與備註"
      >
        {detailRow ?
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">RSVP</dt>
              <dd className="mt-1 flex items-center gap-2 font-medium text-zinc-900 dark:text-zinc-50">
                <RsvpStatusIndicator status={detailRow.rsvpStatus} />
                {rsvpStatusLabelZh(detailRow.rsvpStatus)}
              </dd>
            </div>
            {detailRow.rsvpAtIso ?
              <div>
                <dt className="text-zinc-500 dark:text-zinc-400">回覆時間</dt>
                <dd className="mt-1 tabular-nums font-medium">
                  {formatDateTimeZh(new Date(detailRow.rsvpAtIso))}
                </dd>
              </div>
            : null}
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">原因／備註</dt>
              <dd className="mt-1 whitespace-pre-wrap text-zinc-800 dark:text-zinc-200">
                {detailRow.rsvpReason?.trim() || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500 dark:text-zinc-400">實到（目前勾選）</dt>
              <dd className="mt-1 font-medium">{local[detailRow.memberId] ? "是" : "否"}</dd>
            </div>
          </dl>
        : null}
      </BottomSheet>
    </div>
  );
}
