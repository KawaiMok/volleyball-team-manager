"use client";
import { formatDateTimeZh } from "@/lib/format-datetime";
import { useToast } from "@/components/toast-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { EventCommentRow } from "@/lib/event-comment-types";

type Props = {
  eventId: string;
  currentMemberId: string;
  initialComments: EventCommentRow[];
};

function typeLabel(t: string) {
  return t === "ANNOUNCEMENT" ? "公告" : "留言";
}

/** 球員端：瀏覽公告與留言、發表留言（註解：不可發公告；僅能編刪自己的留言）。 */
export function PlayerEventComments({ eventId, currentMemberId, initialComments }: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  /** 與伺服端列表同步（註解：內部吞掉錯誤，避免 RSC refresh 失敗誤報「網路錯誤」）。 */
  async function refreshList() {
    try {
      const res = await fetch(`/api/events/${eventId}/comments`, { credentials: "include" });
      const data = await res.json().catch(() => null);
      if (res.ok && Array.isArray(data)) {
        setComments(data as EventCommentRow[]);
      }
    } catch {
      /* 列表重整失敗不阻擋已成功之建立／更新 */
    }
    try {
      router.refresh();
    } catch {
      /* Next.js refresh 在部分情況會丟錯 */
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    /** await 後 e.currentTarget 可能為 null（註解：須先保存 form 參考再 reset）。 */
    const form = e.currentTarget;
    const fd = new FormData(form);
    const content = String(fd.get("content") ?? "").trim();
    if (!content) {
      showError("請輸入內容");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "COMMENT", content }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string } & Partial<EventCommentRow>;
      if (!res.ok) {
        showError(data.error ?? `送出失敗 (${res.status})`);
        return;
      }
      if (data.id && data.createdAt) {
        setComments((prev) => [...prev, data as EventCommentRow]);
      }
      showSuccess("已發布留言");
      form.reset();
      void refreshList();
    } catch {
      showError("網路錯誤");
    } finally {
      setPending(false);
    }
  }

  async function saveEdit(id: string) {
    const content = editText.trim();
    if (!content) {
      showError("內容不可為空");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/comments/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError((data as { error?: string }).error ?? `更新失敗 (${res.status})`);
        return;
      }
      setEditingId(null);
      showSuccess("已更新");
      void refreshList();
    } catch {
      showError("網路錯誤");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("確定刪除此則留言？")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/comments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showError((data as { error?: string }).error ?? `刪除失敗 (${res.status})`);
        return;
      }
      showSuccess("已刪除");
      void refreshList();
    } catch {
      showError("網路錯誤");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">公告與留言</h2>
      {comments.length === 0 ?
        <p className="text-sm text-slate-600 dark:text-slate-400">尚無公告或留言。</p>
      : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const isAuthor = c.authorMemberId === currentMemberId;
            const canEditOwn = isAuthor && c.type === "COMMENT";
            return (
              <li
                key={c.id}
                className={
                  c.type === "ANNOUNCEMENT" ?
                    "rounded-xl border border-amber-200 bg-amber-50/90 px-3 py-3"
                  : "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-zinc-900 px-3 py-3 shadow-sm"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{c.authorName}</span>
                    <span className="mx-1.5">·</span>
                    <span className={c.type === "ANNOUNCEMENT" ? "text-amber-900" : "text-slate-600 dark:text-slate-400"}>
                      {typeLabel(c.type)}
                    </span>
                    <span className="mx-1.5">·</span>
                    {formatDateTimeZh(new Date(c.createdAt))}
                  </span>
                  {canEditOwn ?
                    <span className="flex gap-2">
                      {editingId === c.id ?
                        <>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => void saveEdit(c.id)}
                            className="text-blue-600 hover:underline disabled:opacity-50"
                          >
                            儲存
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => setEditingId(null)}
                            className="text-slate-600 dark:text-slate-400 hover:underline disabled:opacity-50"
                          >
                            取消
                          </button>
                        </>
                      : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(c.id);
                              setEditText(c.content);
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            編輯
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(c.id)}
                            className="text-red-600 hover:underline"
                          >
                            刪除
                          </button>
                        </>
                      )}
                    </span>
                  : null}
                </div>
                {editingId === c.id ?
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    className="mt-2 w-full rounded-md border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm text-slate-900 dark:text-slate-50"
                  />
                : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{c.content}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-2 border-t border-slate-200 dark:border-slate-700 pt-4">
        <label htmlFor="player-comment-body" className="block text-sm font-medium text-slate-800 dark:text-slate-200">
          發表留言
        </label>
        <textarea
          id="player-comment-body"
          name="content"
          rows={3}
          maxLength={8000}
          placeholder="與隊友／教練交流…"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "送出中…" : "送出留言"}
        </button>
      </form>
    </section>
  );
}
