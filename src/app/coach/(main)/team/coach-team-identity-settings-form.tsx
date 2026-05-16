"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { normalizeGroupConfigLabels, parseGroupConfigLines } from "@/lib/group-config";

type Props = {
  initialName: string;
  initialSeason: string;
  initialGroupLines: string;
};

/** 隊名、賽季、分組標籤（註解：PATCH `/api/team/settings` 整包更新分組清單）。 */
export function CoachTeamIdentitySettingsForm({ initialName, initialSeason, initialGroupLines }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const seasonRaw = String(fd.get("season") ?? "").trim();
    const linesText = String(fd.get("groupLines") ?? "");
    const groupLabels = normalizeGroupConfigLabels(parseGroupConfigLines(linesText));

    if (!name) {
      setError("隊名為必填");
      setPending(false);
      return;
    }

    try {
      const res = await fetch("/api/team/settings", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          season: seasonRaw ? seasonRaw : null,
          groupLabels,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setPending(false);
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `儲存失敗 (${res.status})`);
        return;
      }
      router.refresh();
    } catch {
      setPending(false);
      setError("網路錯誤");
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      {error ?
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="team-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            隊名<span className="text-red-600">*</span>
          </label>
          <input
            id="team-name"
            name="name"
            type="text"
            required
            maxLength={120}
            defaultValue={initialName}
            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="team-season" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            賽季（選填）
          </label>
          <input
            id="team-season"
            name="season"
            type="text"
            maxLength={64}
            defaultValue={initialSeason}
            placeholder="例如：2026 春季聯賽"
            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="team-groups" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            分組標籤（每行一個）
          </label>
          <textarea
            id="team-groups"
            name="groupLines"
            rows={5}
            defaultValue={initialGroupLines}
            placeholder={"A\nB"}
            className="mt-1 w-full rounded-md border border-zinc-300 dark:border-zinc-600 px-3 py-2 font-mono text-sm shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            用於行事曆／事件篩選與參與者規則。變更後若隊員既有「分組」值不在新清單內，請至名單逐一調整。
          </p>
        </div>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
      >
        {pending ? "儲存中…" : "儲存隊伍資料"}
      </button>
    </form>
  );
}
