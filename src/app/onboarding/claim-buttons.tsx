"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** ALLOW_BOOTSTRAP 時顯示：一鍵加入示範隊（註解：呼叫 POST /api/bootstrap/claim）。 */
export function ClaimDemoTeamButtons() {
  const router = useRouter();
  const [pending, setPending] = useState<false | "COACH" | "PLAYER" | "COACH_PLAYER">(false);
  const [error, setError] = useState<string | null>(null);

  async function claim(role: "COACH" | "PLAYER" | "COACH_PLAYER") {
    setError(null);
    setPending(role);
    try {
      const res = await fetch("/api/bootstrap/claim", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        redirectTo?: string;
      };
      if (!res.ok) {
        setError(data.error ?? `失敗 (${res.status})`);
        setPending(false);
        return;
      }
      const target =
        typeof data.redirectTo === "string" && data.redirectTo.startsWith("/") ?
          data.redirectTo
        : "/";
      router.refresh();
      window.location.assign(target);
    } catch {
      setError("網路錯誤");
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-4">
      <h2 className="text-sm font-semibold text-emerald-950">開發用：加入示範隊伍</h2>
      <p className="mt-1 text-xs leading-relaxed text-emerald-900/90">
        需環境變數 <code className="rounded bg-white/80 px-1">ALLOW_BOOTSTRAP=1</code>。
        會將你目前的 Clerk 帳號加入「示範排球隊」並取得隊籍（與舊版 POST /api/bootstrap 需相同 Email 才能合併的方式不同）。
      </p>
      {error ?
        <p className="mt-2 text-sm text-red-700">{error}</p>
      : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending !== false}
          onClick={() => void claim("COACH")}
          className="rounded-md bg-emerald-800 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-900 disabled:opacity-60"
        >
          {pending === "COACH" ? "處理中…" : "以教練身分加入"}
        </button>
        <button
          type="button"
          disabled={pending !== false}
          onClick={() => void claim("PLAYER")}
          className="rounded-md border border-emerald-700 bg-white px-3 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-60"
        >
          {pending === "PLAYER" ? "處理中…" : "以球員身分加入"}
        </button>
        <button
          type="button"
          disabled={pending !== false}
          onClick={() => void claim("COACH_PLAYER")}
          className="rounded-md border border-emerald-600 bg-emerald-100/90 px-3 py-2 text-sm font-medium text-emerald-950 hover:bg-emerald-200/90 disabled:opacity-60"
        >
          {pending === "COACH_PLAYER" ? "處理中…" : "教練兼球員"}
        </button>
      </div>
    </div>
  );
}
