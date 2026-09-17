"use client";

import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { useToast } from "@/components/toast-provider";
import { useActiveTeamSwitch } from "@/components/active-team-switch-context";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import {
  formatActiveTeamOptionLabel,
  shouldShowOrgInTeamLabels,
  type ActiveTeamOption,
} from "@/lib/active-team-options";

type Props = {
  teams: ActiveTeamOption[];
  currentTeamId: string;
  /** 教練端／球員端樣式（註解：下拉外觀微調）。 */
  variant: "coach" | "player";
  /** 頂欄精簡按鈕（註解：Capacitor 手機用）。 */
  display?: "default" | "header";
};

/** 多隊切換：POST /api/me/active-team 後 refresh（註解：可跨組織；手機用 BottomSheet）。 */
export function ActiveTeamSwitcher({ teams, currentTeamId, variant, display = "default" }: Props) {
  const router = useRouter();
  const { showError } = useToast();
  const teamSwitch = useActiveTeamSwitch();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [sheetOpen, setSheetOpen] = useState(false);

  const showOrg = useMemo(() => shouldShowOrgInTeamLabels(teams), [teams]);
  const currentTeam = teams.find((t) => t.id === currentTeamId);

  if (teams.length <= 1) {
    return null;
  }

  const selectClass =
    variant === "coach" ?
      "min-w-[10rem] max-w-[min(100vw-8rem,20rem)] truncate rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm font-semibold text-zinc-900 shadow-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
    : "min-w-[10rem] max-w-[min(100vw-8rem,20rem)] truncate rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-semibold text-slate-900 shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50";

  const headerBtnClass =
    variant === "coach" ?
      "flex min-w-0 max-w-full items-center gap-1 rounded-lg border border-zinc-200 bg-white/80 px-2 py-1 text-left dark:border-zinc-700 dark:bg-zinc-900/80"
    : "flex min-w-0 max-w-full items-center gap-1 rounded-lg border border-slate-200 bg-white/80 px-2 py-1 text-left dark:border-slate-700 dark:bg-slate-900/80";

  async function switchTeam(teamId: string) {
    if (teamId === currentTeamId) {
      setSheetOpen(false);
      return;
    }

    const hit = teams.find((t) => t.id === teamId);
    const nextLabel = hit ? formatActiveTeamOptionLabel(hit, showOrg) : "新隊伍";
    teamSwitch?.beginSwitch(teamId, nextLabel);

    startTransition(async () => {
      const res = await fetch("/api/me/active-team", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        teamSwitch?.cancelSwitch();
        showError((data as { error?: string }).error ?? `失敗 (${res.status})`);
        return;
      }
      setSheetOpen(false);

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

  const currentLabel = currentTeam ?
    formatActiveTeamOptionLabel(currentTeam, showOrg)
  : "選擇隊伍";

  const sheet = (
    <BottomSheet
      open={sheetOpen}
      onClose={() => setSheetOpen(false)}
      title="切換隊伍"
      subtitle={showOrg ? "你可管理多個組織下的隊伍" : "選擇要檢視的隊伍"}
    >
      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
        {teams.map((t) => {
          const selected = t.id === currentTeamId;
          return (
            <li key={t.id}>
              <button
                type="button"
                disabled={pending}
                onClick={() => void switchTeam(t.id)}
                className={`flex w-full flex-col items-start px-4 py-3.5 text-left ${
                  selected ?
                    "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                  : "text-zinc-900 active:bg-zinc-50 dark:text-zinc-50 dark:active:bg-zinc-900"
                }`}
              >
                <span className="text-sm font-semibold">{t.name}</span>
                {showOrg ?
                  <span className="mt-0.5 text-xs opacity-80">{t.organizationName}</span>
                : null}
                {selected ?
                  <span className="mt-1 text-[10px] font-medium uppercase tracking-wide">目前</span>
                : null}
              </button>
            </li>
          );
        })}
      </ul>
    </BottomSheet>
  );

  if (display === "header") {
    return (
      <div className="min-w-0 max-w-[min(100%,14rem)]">
        <button
          type="button"
          disabled={pending}
          onClick={() => setSheetOpen(true)}
          className={headerBtnClass}
          aria-label={`目前隊伍：${currentLabel}，點此切換`}
        >
          <span className="min-w-0 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {currentTeam?.name ?? "隊伍"}
          </span>
          <span className="shrink-0 text-xs text-zinc-400" aria-hidden>
            ▾
          </span>
        </button>
        {sheet}
      </div>
    );
  }

  return (
    <div className="min-w-0 max-w-full">
      {/* 手機：大按鈕 + BottomSheet */}
      <button
        type="button"
        disabled={pending}
        onClick={() => setSheetOpen(true)}
        className={`md:hidden ${selectClass} flex min-h-11 w-full min-w-0 max-w-full items-center justify-between gap-2 text-left`}
        aria-label={`目前隊伍：${currentLabel}，點此切換`}
      >
        <span className="min-w-0 truncate">{currentLabel}</span>
        <span className="shrink-0 text-zinc-400" aria-hidden>
          ▾
        </span>
      </button>

      {/* 桌面：原生 select */}
      <select
        className={`${selectClass} hidden md:block`}
        value={currentTeamId}
        disabled={pending}
        onChange={(e) => void switchTeam(e.target.value)}
        aria-label="目前隊伍，點此切換"
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {formatActiveTeamOptionLabel(t, showOrg)}
          </option>
        ))}
      </select>

      {sheet}
    </div>
  );
}
