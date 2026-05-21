"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AppLogo } from "@/components/brand/app-logo";
import { InlineSpinner } from "@/components/inline-spinner";
import {
  InsetGroupedList,
  InsetGroupedRow,
  InsetGroupedSection,
} from "@/components/ui/inset-grouped-list";
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
 * 通知收件匣（註解：iOS grouped list 風格；點擊導向 path 並標已讀）。
 */
export function NotificationInbox({ backHref, surface }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

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
        <Link href={backHref} className="text-sm text-[var(--brand-primary)] hover:underline">
          ← 返回
        </Link>
        {unread > 0 ?
          <button
            type="button"
            disabled={pending}
            onClick={() => void markAllRead()}
            className="text-sm font-medium text-[var(--brand-primary)] hover:underline disabled:opacity-50"
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
        <div className="flex flex-col items-center gap-4 py-12">
          <AppLogo variant="mascot" size={64} />
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            尚無通知。發布活動、留言或推播測試後會出現在這裡。
          </p>
        </div>
      : (
        <InsetGroupedList>
          <InsetGroupedSection
            header={surface === "coach" ? "教練通知" : "我的通知"}
            footer={unread > 0 ? `${unread} 則未讀` : undefined}
          >
            {items.map((n) => (
              <InsetGroupedRow
                key={n.id}
                onClick={() => void openItem(n)}
                unread={!n.readAt}
                chevron={Boolean(n.path)}
                title={n.title}
                subtitle={
                  <>
                    {n.body}
                    <span className="mt-1 block text-[10px] text-zinc-400">
                      {formatDateTimeZh(new Date(n.createdAt), {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                }
              />
            ))}
          </InsetGroupedSection>
        </InsetGroupedList>
      )}
    </div>
  );
}
