"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** 平台：建立組織表單。 */
export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          contactEmail: contactEmail.trim() || null,
        }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "建立失敗");
        return;
      }
      router.push(`/platform/organizations/${data.id}`);
      router.refresh();
    } catch {
      setError("網路錯誤");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">新增組織</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          建立租戶後可指派組織管理員，由其管理旗下球隊。
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">組織名稱</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="例如：某某高中排球協會"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Slug（URL 識別）</span>
          <input
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="例如：school-vb"
          />
          <span className="text-xs text-zinc-500">小寫英數與連字號；組織後台網址為 /org/{slug}</span>
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">聯絡 Email（選填）</span>
          <input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
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
          {loading ? "建立中…" : "建立組織"}
        </button>
      </form>
    </div>
  );
}
