"use client";
import { useToast } from "@/components/toast-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** 連結列（註解：由伺服端序列化）。 */
export type TacticalVideoLinkRow = {
  id: string;
  url: string;
  name: string | null;
  createdAt: string;
};

type Props = {
  eventId: string;
  canEdit: boolean;
  tactical: TacticalVideoLinkRow[];
  video: TacticalVideoLinkRow[];
};

function LinkRow({
  row,
  onDelete,
  deleting,
  showDelete,
}: {
  row: TacticalVideoLinkRow;
  onDelete: (id: string) => void;
  deleting: boolean;
  showDelete: boolean;
}) {
  const label = row.name?.trim() || row.url;
  return (
    <li className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-zinc-100 bg-zinc-50 dark:bg-zinc-950/80 px-3 py-2 text-sm">
      <a
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 break-all font-medium text-blue-600 hover:underline"
      >
        {label}
      </a>
      {showDelete ?
        <button
          type="button"
          disabled={deleting}
          onClick={() => onDelete(row.id)}
          className="shrink-0 text-xs text-red-700 hover:underline disabled:opacity-50"
        >
          移除
        </button>
      : null}
    </li>
  );
}

/** 教練端：戰術板與影片連結整理（註解：FileAsset LINK + category）。 */
export function CoachEventTacticalVideoPanel({ eventId, canEdit, tactical, video }: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function onDelete(assetId: string) {
    if (!canEdit) return;
    setDeletingId(assetId);
    try {
      const res = await fetch(`/api/events/${eventId}/file-assets/${assetId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      setDeletingId(null);
      if (!res.ok) {
        showError((data as { error?: string }).error ?? `刪除失敗 (${res.status})`);
        return;
      }
      showSuccess("已移除連結");
      router.refresh();
    } catch {
      setDeletingId(null);
      showError("網路錯誤");
    }
  }

  async function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canEdit) return;
    const form = e.currentTarget;
    setPending(true);
    const fd = new FormData(form);
    const category = String(fd.get("category") ?? "TACTICAL_BOARD");
    const url = String(fd.get("url") ?? "").trim();
    const name = String(fd.get("name") ?? "").trim() || null;
    try {
      const res = await fetch(`/api/events/${eventId}/file-assets`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, url, name }),
      });
      const data = await res.json().catch(() => ({}));
      setPending(false);
      if (!res.ok) {
        showError((data as { error?: string }).error ?? `新增失敗 (${res.status})`);
        return;
      }
      form.reset();
      showSuccess("已新增連結");
      router.refresh();
    } catch {
      setPending(false);
      showError("網路錯誤");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">戰術板</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Excalidraw、Miro、Google Jam 等外部白板連結。</p>
          {tactical.length === 0 ?
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">尚無連結</p>
          : (
            <ul className="mt-2 space-y-2">
              {tactical.map((row) => (
                <LinkRow
                  key={row.id}
                  row={row}
                  onDelete={onDelete}
                  deleting={deletingId === row.id}
                  showDelete={canEdit}
                />
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">影片／重播</h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">YouTube、隊內錄影雲端等連結，方便賽後複習。</p>
          {video.length === 0 ?
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">尚無連結</p>
          : (
            <ul className="mt-2 space-y-2">
              {video.map((row) => (
                <LinkRow
                  key={row.id}
                  row={row}
                  onDelete={onDelete}
                  deleting={deletingId === row.id}
                  showDelete={canEdit}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {canEdit ?
        <form onSubmit={(e) => void onAdd(e)} className="space-y-3 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-950/50 p-4">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">新增連結</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">類型</span>
              <select
                name="category"
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                defaultValue="TACTICAL_BOARD"
              >
                <option value="TACTICAL_BOARD">戰術板</option>
                <option value="VIDEO">影片／重播</option>
              </select>
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">網址（https…）</span>
              <input
                name="url"
                type="url"
                required
                placeholder="https://"
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">顯示名稱（選填）</span>
              <input
                name="name"
                type="text"
                maxLength={200}
                placeholder="例如：對手發球輪轉位"
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {pending ? "加入中…" : "加入連結"}
          </button>
        </form>
      : (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">已取消的事件無法變更連結。</p>
      )}
    </div>
  );
}
