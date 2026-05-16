"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type TeamOption = { id: string; name: string };

type Props = {
  teams: TeamOption[];
  currentTeamId: string;
  /** 教練端／球員端樣式（註解：下拉外觀微調）。 */
  variant: "coach" | "player";
};

/** 多隊切換：POST /api/me/active-team 後 refresh（註解：事件詳情會改隊導致查無資料 → 改導向列表）。 */
export function ActiveTeamSwitcher({ teams, currentTeamId, variant }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (teams.length <= 1) {
    return null;
  }

  const selectClass =
    variant === "coach" ?
      "min-w-[10rem] max-w-[min(100vw-8rem,18rem)] truncate rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-2 py-1.5 text-sm font-semibold text-zinc-900 dark:text-zinc-50 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900"
    : "min-w-[10rem] max-w-[min(100vw-8rem,18rem)] truncate rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm font-semibold text-slate-900 dark:text-slate-50 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900";

  async function onChange(teamId: string) {
    if (teamId === currentTeamId) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/me/active-team", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? `失敗 (${res.status})`);
        return;
      }
      const onCoachEventDetail = /^\/coach\/events\/[^/]+$/.test(pathname ?? "");
      const onPlayerEventDetail = /^\/player\/events\/[^/]+$/.test(pathname ?? "");
      if (onCoachEventDetail) {
        router.push("/coach/events");
        return;
      }
      if (onPlayerEventDetail) {
        router.push("/player");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="shrink-0">
      <select
        className={selectClass}
        value={currentTeamId}
        disabled={pending}
        onChange={(e) => void onChange(e.target.value)}
        aria-label="目前隊伍，點此切換"
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
