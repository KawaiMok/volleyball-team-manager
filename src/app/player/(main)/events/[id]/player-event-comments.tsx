"use client";

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
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  async function refreshList() {
    const res = await fetch(`/api/events/${eventId}/comments`, { credentials: "include" });
    const data = await res.json().catch(() => null);
    if (res.ok && Array.isArray(data)) {
      setComments(data as EventCommentRow[]);
    }
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const content = String(fd.get("content") ?? "").trim();
    if (!content) {
      setError("請輸入內容");
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
      const data = await res.json().catch(() => ({}));
      setPending(false);
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `送出失敗 (${res.status})`);
        return;
      }
      (e.currentTarget as HTMLFormElement).reset();
      await refreshList();
    } catch {
      setPending(false);
      setError("網路錯誤");
    }
  }

  async function saveEdit(id: string) {
    setError(null);
    const content = editText.trim();
    if (!content) {
      setError("內容不可為空");
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
      setPending(false);
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `更新失敗 (${res.status})`);
        return;
      }
      setEditingId(null);
      await refreshList();
    } catch {
      setPending(false);
      setError("網路錯誤");
    }
  }

  async function remove(id: string) {
    if (!window.confirm("確定刪除此則留言？")) return;
    setError(null);
    setPending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/comments/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setPending(false);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? `刪除失敗 (${res.status})`);
        return;
      }
      await refreshList();
    } catch {
      setPending(false);
      setError("網路錯誤");
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">公告與留言</h2>
      {error ?
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      : null}

      {comments.length === 0 ?
        <p className="text-sm text-slate-600">尚無公告或留言。</p>
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
                  : "rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    <span className="font-medium text-slate-800">{c.authorName}</span>
                    <span className="mx-1.5">·</span>
                    <span className={c.type === "ANNOUNCEMENT" ? "text-amber-900" : "text-slate-600"}>
                      {typeLabel(c.type)}
                    </span>
                    <span className="mx-1.5">·</span>
                    {new Date(c.createdAt).toLocaleString("zh-TW")}
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
                            className="text-slate-600 hover:underline disabled:opacity-50"
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
                    className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  />
                : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{c.content}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-2 border-t border-slate-200 pt-4">
        <label htmlFor="player-comment-body" className="block text-sm font-medium text-slate-800">
          發表留言
        </label>
        <textarea
          id="player-comment-body"
          name="content"
          rows={3}
          maxLength={8000}
          placeholder="與隊友／教練交流…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
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
