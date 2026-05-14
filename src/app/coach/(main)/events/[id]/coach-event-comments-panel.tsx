"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import type { EventCommentRow } from "@/lib/event-comment-types";

type Props = {
  eventId: string;
  currentMemberId: string;
  /** 可發公告與刪改他人留言（註解：管理員、教練、隊務）。 */
  canManageAll: boolean;
  initialComments: EventCommentRow[];
};

function typeLabel(t: string) {
  return t === "ANNOUNCEMENT" ? "公告" : "留言";
}

/** 教練端：事件公告與留言列表、發佈與編修（註解：API `/api/events/[id]/comments`）。 */
export function CoachEventCommentsPanel({ eventId, currentMemberId, canManageAll, initialComments }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [draftType, setDraftType] = useState<"ANNOUNCEMENT" | "COMMENT">("COMMENT");
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
      const type = canManageAll ? draftType : "COMMENT";
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, content }),
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

  function startEdit(c: EventCommentRow) {
    setEditingId(c.id);
    setEditText(c.content);
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
    if (!window.confirm("確定刪除此則內容？")) return;
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
    <div className="space-y-4">
      {error ?
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      : null}

      {comments.length === 0 ?
        <p className="text-sm text-zinc-500">尚無公告或留言。</p>
      : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const isAuthor = c.authorMemberId === currentMemberId;
            const canEdit = isAuthor || canManageAll;
            return (
              <li
                key={c.id}
                className={
                  c.type === "ANNOUNCEMENT" ?
                    "rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-3"
                  : "rounded-lg border border-zinc-200 bg-zinc-50/80 px-3 py-3"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500">
                  <span>
                    <span className="font-medium text-zinc-700">{c.authorName}</span>
                    <span className="mx-1.5">·</span>
                    <span
                      className={
                        c.type === "ANNOUNCEMENT" ? "text-amber-800" : "text-zinc-600"
                      }
                    >
                      {typeLabel(c.type)}
                    </span>
                    <span className="mx-1.5">·</span>
                    {new Date(c.createdAt).toLocaleString("zh-TW")}
                    {c.updatedAt !== c.createdAt ?
                      <span className="text-zinc-400">（已編輯）</span>
                    : null}
                  </span>
                  {canEdit ?
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
                            className="text-zinc-600 hover:underline disabled:opacity-50"
                          >
                            取消
                          </button>
                        </>
                      : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(c)}
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
                    className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                  />
                : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800">{c.content}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 border-t border-zinc-100 pt-4">
        {canManageAll ?
          <div>
            <label htmlFor="coach-comment-type" className="block text-sm font-medium text-zinc-700">
              類型
            </label>
            <select
              id="coach-comment-type"
              value={draftType}
              onChange={(e) => setDraftType(e.target.value as "ANNOUNCEMENT" | "COMMENT")}
              className="mt-1 rounded-md border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="COMMENT">留言</option>
              <option value="ANNOUNCEMENT">公告</option>
            </select>
          </div>
        : null}
        <div>
          <label htmlFor="coach-comment-body" className="block text-sm font-medium text-zinc-700">
            {canManageAll ? "新增內容" : "新增留言"}
          </label>
          <textarea
            id="coach-comment-body"
            name="content"
            rows={4}
            maxLength={8000}
            placeholder="輸入文字…"
            className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "送出中…" : "發布"}
        </button>
      </form>
    </div>
  );
}
