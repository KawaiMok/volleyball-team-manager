"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { InlineSpinner } from "@/components/inline-spinner";
import { formatDateTimeZh } from "@/lib/format-datetime";

type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  body: string;
  path: string | null;
  readAt: string | null;
  createdAt: string;
};

type Props = {
  /** 返回連結（註解：教練／球員端首頁）。 */
  backHref: string;
  surface: "coach" | "player";
};

/**
 * 通知收件匣（註解：類似 Facebook 通知列表；點擊導向 `path` 並標已讀）。
 */
export function NotificationInbox({ backHref, surface }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  const card =
    surface === "coach" ?
      "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
    : "border-slate-200 bg-white dark:border-slate-700 dark:bg-zinc-900";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/me/notifications?limit=50", { credentials: "include" });
      const data = (await res.json()) as { items?: NotificationItem[]; error?: string };
      if (res.ok && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function markAllRead() {
    setPending(true);
    try {
      await fetch("/api/me/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      window.dispatchEvent(new Event("notifications-updated"));
    } finally {
      setPending(false);
    }
  }

  async function openItem(item: NotificationItem) {
    if (!item.readAt) {
      await fetch("/api/me/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [item.id] }),
      });
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
      window.dispatchEvent(new Event("notifications-updated"));
    }
    if (item.path?.startsWith("/")) {
      router.push(item.path);
    }
  }

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="text-sm text-blue-600 hover:underline">
          ← 返回
        </Link>
        {unread > 0 ?
          <button
            type="button"
            disabled={pending}
            onClick={() => void markAllRead()}
            className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50"
          >
            {pending ? "處理中…" : "全部標為已讀"}
          </button>
        : null}
      </div>

      <h1 className="text-2xl font-semibold tracking-tight">通知</h1>

      {loading ?
        <div className="flex justify-center py-12">
          <InlineSpinner className="h-8 w-8" />
        </div>
      : items.length === 0 ?
        <p className={`rounded-xl border px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400 ${card}`}>
          尚無通知。發布活動、留言或推播測試後會出現在這裡。
        </p>
      : (
        <ul className={`divide-y overflow-hidden rounded-xl border shadow-sm ${card}`}>
          {items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => void openItem(n)}
                className={`flex w-full gap-3 px-4 py-3.5 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-950/80 ${
                  !n.readAt ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                }`}
              >
                {!n.readAt ?
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600"
                    aria-hidden
                  />
                : (
                  <span className="mt-1.5 h-2 w-2 shrink-0" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-zinc-900 dark:text-zinc-50">{n.title}</span>
                  <span className="mt-0.5 block text-sm text-zinc-600 dark:text-zinc-400">{n.body}</span>
                  <span className="mt-1 block text-xs text-zinc-400">
                    {formatDateTimeZh(new Date(n.createdAt), {
                      month: "numeric",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
