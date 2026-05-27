"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { organizationId: string };

/** 指派組織管理員表單（註解：平台超管或 ORG_ADMIN 共用）。 */
export function AddOrgMemberForm({ organizationId, apiPath }: Props & { apiPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName: displayName.trim() || null,
          role: "ORG_ADMIN",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "指派失敗");
        return;
      }
      setEmail("");
      setDisplayName("");
      router.refresh();
    } catch {
      setError("網路錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold">指派組織管理員</h3>
      <p className="text-xs text-zinc-500">
        依 Email 預建帳號；對方 Clerk 登入後即可進入組織後台（/org/…）。
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="coach@example.com"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="顯示名稱（選填）"
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      {error ?
        <p className="text-sm text-red-600">{error}</p>
      : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "處理中…" : "指派"}
      </button>
    </form>
  );
}
