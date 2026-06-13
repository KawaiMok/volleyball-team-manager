"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SPORT_CREATE_OPTIONS, getSportDisplayName } from "@/lib/sports/sport-options";
import type { SportId } from "@/lib/sports/sport-id";

type Props = {
  orgId: string;
  orgSlug: string;
};

/** 建立球隊表單（註解：client 元件；orgId 由 Server 傳入）。 */
export function CreateTeamForm({ orgId, orgSlug }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [sport, setSport] = useState<SportId>("VOLLEYBALL");
  const [season, setSeason] = useState(new Date().getFullYear().toString());
  const [coachEmail, setCoachEmail] = useState("");
  const [coachName, setCoachName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          sport,
          season: season.trim() || null,
          initialCoaches: coachEmail.trim() ?
            [
              {
                email: coachEmail.trim(),
                role: "ADMIN",
                displayName: coachName.trim() || null,
              },
            ]
          : [],
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "建立失敗");
        return;
      }
      router.push(`/org/${orgSlug}/teams/${data.id}`);
      router.refresh();
    } catch {
      setError("網路錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <fieldset className="space-y-2 text-sm">
        <legend className="font-medium">運動類型</legend>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">建立後不可變更，請謹慎選擇。</p>
        <div className="flex flex-wrap gap-3">
          {SPORT_CREATE_OPTIONS.map((s) => (
            <label key={s} className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="sport"
                value={s}
                checked={sport === s}
                onChange={() => setSport(s)}
              />
              <span>{getSportDisplayName(s)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">球隊名稱</span>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="例如：U18 女排"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">賽季</span>
        <input
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </label>
      <hr className="border-zinc-200 dark:border-zinc-800" />
      <p className="text-sm font-medium">首位教練（建議填寫）</p>
      <label className="block space-y-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">教練 Email</span>
        <input
          type="email"
          value={coachEmail}
          onChange={(e) => setCoachEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          placeholder="coach@example.com"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="text-zinc-600 dark:text-zinc-400">顯示名稱（選填）</span>
        <input
          value={coachName}
          onChange={(e) => setCoachName(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
        />
      </label>
      {error ?
        <p className="text-sm text-red-600">{error}</p>
      : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--brand-primary)] py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "建立中…" : "建立球隊"}
      </button>
    </form>
  );
}
