"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { useToast } from "@/components/toast-provider";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { formatDateTimeZh } from "@/lib/format-datetime";

export type CoachPlayerReviewRow = {
  memberId: string;
  displayName: string;
  review: {
    id: string;
    content: string;
    authorName: string;
    updatedAt: string;
  } | null;
};

type Props = {
  eventId: string;
  rows: CoachPlayerReviewRow[];
  /** 事件已結束才可撰寫（註解：與 API 一致）。 */
  canEdit: boolean;
};

/** 教練：對每位球員撰寫私評（註解：僅教練與該球員可見）。 */
export function CoachPlayerReviewsPanel({ eventId, rows: initialRows, canEdit }: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [rows, setRows] = useState(initialRows);
  const [editing, setEditing] = useState<CoachPlayerReviewRow | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);

  const openEdit = useCallback((row: CoachPlayerReviewRow) => {
    setEditing(row);
    setDraft(row.review?.content ?? "");
  }, []);

  const closeEdit = useCallback(() => {
    setEditing(null);
    setDraft("");
  }, []);

  async function saveReview() {
    if (!editing) return;
    setPending(true);
    const res = await fetch(`/api/events/${eventId}/player-reviews/${editing.memberId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      showError((data as { error?: string }).error ?? "儲存失敗");
      return;
    }

    const trimmed = draft.trim();
    if ((data as { deleted?: boolean }).deleted || !trimmed) {
      setRows((prev) =>
        prev.map((r) =>
          r.memberId === editing.memberId ? { ...r, review: null } : r,
        ),
      );
      showSuccess("已清除評語");
    } else {
      const updatedAt = (data as { updatedAt?: string }).updatedAt ?? new Date().toISOString();
      setRows((prev) =>
        prev.map((r) =>
          r.memberId === editing.memberId ?
            {
              ...r,
              review: {
                id: (data as { id: string }).id,
                content: trimmed,
                authorName: "我",
                updatedAt,
              },
            }
          : r,
        ),
      );
      showSuccess("已儲存評語");
    }
    closeEdit();
    router.refresh();
  }

  const writtenCount = rows.filter((r) => r.review?.content.trim()).length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {canEdit ?
            "事件結束後，可對每位球員寫下私評；僅你與該球員本人可見。"
          : "事件結束後才可撰寫評語。"}
        </p>
        {canEdit && rows.length > 0 ?
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            已寫 {writtenCount} / {rows.length}
          </span>
        : null}
      </div>

      {rows.length === 0 ?
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">本場無球員參與者。</p>
      : (
        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <tr>
                <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">姓名</th>
                <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">狀態</th>
                <th className="px-3 py-2 font-medium text-zinc-600 dark:text-zinc-400">
                  <span className="sr-only">操作</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((r) => (
                <tr key={r.memberId}>
                  <td className="px-3 py-2 font-medium">{r.displayName}</td>
                  <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">
                    {r.review?.content.trim() ?
                      <span className="text-emerald-700 dark:text-emerald-400">已撰寫</span>
                    : <span>未撰寫</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => openEdit(r)}
                      className="text-xs text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
                    >
                      {r.review ? "編輯" : "撰寫"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ?
        <BottomSheet
          open
          onClose={closeEdit}
          title={`${editing.displayName} · 評語`}
          subtitle="僅教練與此球員可見"
          tall
          footer={
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeEdit}
                disabled={pending}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void saveReview()}
                disabled={pending}
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {pending ? "儲存中…" : "儲存評語"}
              </button>
            </div>
          }
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            maxLength={4000}
            placeholder="表現、技術重點、下次改進方向…"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          {editing.review ?
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              上次更新：
              {formatDateTimeZh(new Date(editing.review.updatedAt))}
              {editing.review.authorName ? ` · ${editing.review.authorName}` : null}
            </p>
          : null}
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            清空內容後儲存可移除評語。
          </p>
        </BottomSheet>
      : null}
    </>
  );
}
