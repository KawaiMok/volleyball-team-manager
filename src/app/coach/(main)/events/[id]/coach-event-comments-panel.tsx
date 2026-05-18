"use client";
import { useToast } from "@/components/toast-provider";

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
  const { showError, showSuccess } = useToast();
  const [comments, setComments] = useState(initialComments);
  const [pending, setPending] = useState(false);
  const [draftType, setDraftType] = useState<"ANNOUNCEMENT" | "COMMENT">("COMMENT");
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
      /* Next.js refresh 在部分情況會丟錯，不影響本地 state */
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    /** await 後 e.currentTarget 可能為 null，須先保存（註解：否則 reset() 拋錯誤判成網路錯誤）。 */
    const form = e.currentTarget;
    const fd = new FormData(form);
    const content = String(fd.get("content") ?? "").trim();
    if (!content) {
      showError("請輸入內容");
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
      const data = (await res.json().catch(() => ({}))) as { error?: string } & Partial<EventCommentRow>;
      if (!res.ok) {
        showError(data.error ?? `送出失敗 (${res.status})`);
        return;
      }
      /** 立即併入新列（註解：201 成功後不依賴二次 GET，避免 refresh 異常被當成發布失敗）。 */
      if (data.id && data.createdAt) {
        setComments((prev) => [...prev, data as EventCommentRow]);
      }
      showSuccess(type === "ANNOUNCEMENT" ? "已發布公告" : "已發布留言");
      form.reset();
      void refreshList();
    } catch {
      showError("網路錯誤");
    } finally {
      setPending(false);
    }
  }

  function startEdit(c: EventCommentRow) {
    setEditingId(c.id);
    setEditText(c.content);
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
    if (!window.confirm("確定刪除此則內容？")) return;
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
    <div className="space-y-4">
      {comments.length === 0 ?
        <p className="text-sm text-zinc-500 dark:text-zinc-400">尚無公告或留言。</p>
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
                  : "rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 px-3 py-3"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{c.authorName}</span>
                    <span className="mx-1.5">·</span>
                    <span
                      className={
                        c.type === "ANNOUNCEMENT" ? "text-amber-800" : "text-zinc-600 dark:text-zinc-400"
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
                            className="text-zinc-600 dark:text-zinc-400 hover:underline disabled:opacity-50"
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
                    className="mt-2 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
                  />
                : (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">{c.content}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-3 border-t border-zinc-100 pt-4">
        {canManageAll ?
          <div>
            <label htmlFor="coach-comment-type" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              類型
            </label>
            <select
              id="coach-comment-type"
              value={draftType}
              onChange={(e) => setDraftType(e.target.value as "ANNOUNCEMENT" | "COMMENT")}
              className="mt-1 rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm"
            >
              <option value="COMMENT">留言</option>
              <option value="ANNOUNCEMENT">公告</option>
            </select>
          </div>
        : null}
        <div>
          <label htmlFor="coach-comment-body" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {canManageAll ? "新增內容" : "新增留言"}
          </label>
          <textarea
            id="coach-comment-body"
            name="content"
            rows={4}
            maxLength={8000}
            placeholder="輸入文字…"
            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
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
