"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  MatchResultVisualization,
  type MatchResultViewData,
} from "@/app/coach/(main)/events/[id]/match-result-visualization";
import { MatchPlayerStatsInputSection } from "@/components/match-player-stats-input-section";
import { MatchTeamStatsInputSection, type TeamStatsForm } from "@/components/match-team-stats-section";
import { useToast } from "@/components/toast-provider";
import {
  EMPTY_PLAYER_STATS,
  normalizePlayerStats,
  type MatchResultPlayerRow,
  type MatchSetScore,
  type StatCategory,
} from "@/lib/match-result-schema";
import {
  parseNonNegativeInt,
  parseNonNegativeIntOrZero,
  sanitizeNonNegativeIntInput,
} from "@/lib/numeric-input";

export type { MatchResultPlayerRow };

type Props = {
  eventId: string;
  teamName: string;
  canEdit: boolean;
  initial: MatchResultViewData | null;
  roster: MatchResultPlayerRow[];
};

const EMPTY_TEAM: TeamStatsForm = {
  points: "",
  opponentPoints: "",
  kills: "",
  errors: "",
  aces: "",
  blocks: "",
  digs: "",
};

function parseOptionalInt(s: string): number | undefined {
  return parseNonNegativeInt(s);
}

/** 各局比分表單列（註解：字串欄位避免 number input 無法輸入）。 */
type SetScoreForm = { our: string; opponent: string };

function initSets(initial: MatchResultViewData | null): SetScoreForm[] {
  if (initial?.sets?.length) {
    return initial.sets.map((s) => ({
      our: s.our === 0 ? "" : String(s.our),
      opponent: s.opponent === 0 ? "" : String(s.opponent),
    }));
  }
  return [{ our: "", opponent: "" }];
}

function setsFormToPayload(forms: SetScoreForm[]): MatchSetScore[] {
  return forms.map((s) => ({
    our: parseNonNegativeIntOrZero(s.our),
    opponent: parseNonNegativeIntOrZero(s.opponent),
  }));
}

function initTeamStats(initial: MatchResultViewData | null): TeamStatsForm {
  if (!initial?.teamStats) return { ...EMPTY_TEAM };
  const t = initial.teamStats;
  return {
    points: t.points != null ? String(t.points) : "",
    opponentPoints: t.opponentPoints != null ? String(t.opponentPoints) : "",
    kills: t.kills != null ? String(t.kills) : "",
    errors: t.errors != null ? String(t.errors) : "",
    aces: t.aces != null ? String(t.aces) : "",
    blocks: t.blocks != null ? String(t.blocks) : "",
    digs: t.digs != null ? String(t.digs) : "",
  };
}

function initPlayerMap(initial: MatchResultViewData | null, roster: MatchResultPlayerRow[]) {
  const map = new Map<string, MatchResultPlayerRow>();
  for (const r of roster) {
    const hit = initial?.playerStats.find((p) => p.memberId === r.memberId);
    map.set(r.memberId, {
      memberId: r.memberId,
      displayName: r.displayName,
      stats: hit ? normalizePlayerStats(hit.stats) : { ...EMPTY_PLAYER_STATS },
    });
  }
  return map;
}

/** 教練：比賽結果登錄與可視化（註解：六大分類 tab）。 */
export function MatchResultPanel({ eventId, teamName, canEdit, initial, roster }: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [mode, setMode] = useState<"view" | "edit">(initial ? "view" : canEdit ? "edit" : "view");
  const [saved, setSaved] = useState<MatchResultViewData | null>(initial);
  const [opponentName, setOpponentName] = useState(initial?.opponentName ?? "");
  const [sets, setSets] = useState<SetScoreForm[]>(() => initSets(initial));
  const [teamStats, setTeamStats] = useState<TeamStatsForm>(() => initTeamStats(initial));
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [playerMap, setPlayerMap] = useState(() => initPlayerMap(initial, roster));
  const [pending, setPending] = useState(false);

  const viewData = saved;
  const playerRows = useMemo(() => Array.from(playerMap.values()), [playerMap]);

  const updateStat = useCallback(
    (memberId: string, category: StatCategory, field: string, value: string) => {
      const n = parseNonNegativeIntOrZero(sanitizeNonNegativeIntInput(value));
      setPlayerMap((prev) => {
        const next = new Map(prev);
        const row = next.get(memberId);
        if (!row) return prev;
        const catStats = { ...row.stats[category] } as Record<string, number>;
        catStats[field] = n;
        next.set(memberId, {
          ...row,
          stats: { ...row.stats, [category]: catStats },
        });
        return next;
      });
    },
    [],
  );

  async function save() {
    setPending(true);
    const teamStatsPayload = {
      points: parseOptionalInt(teamStats.points),
      opponentPoints: parseOptionalInt(teamStats.opponentPoints),
      kills: parseOptionalInt(teamStats.kills),
      errors: parseOptionalInt(teamStats.errors),
      aces: parseOptionalInt(teamStats.aces),
      blocks: parseOptionalInt(teamStats.blocks),
      digs: parseOptionalInt(teamStats.digs),
    };
    const hasTeamStats = Object.values(teamStatsPayload).some((v) => v != null);

    const res = await fetch(`/api/events/${eventId}/match-result`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        opponentName: opponentName.trim() || null,
        sets: setsFormToPayload(sets),
        teamStats: hasTeamStats ? teamStatsPayload : null,
        notes: notes.trim() || null,
        playerStats: playerRows.map((p) => ({
          memberId: p.memberId,
          stats: p.stats,
        })),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setPending(false);
    if (!res.ok) {
      showError((data as { error?: string }).error ?? "儲存失敗");
      return;
    }
    const result = (data as { result: MatchResultViewData }).result;
    setSaved(result);
    setMode("view");
    showSuccess("比賽結果已儲存");
    router.refresh();
  }

  async function clearResult() {
    if (!confirm("確定清除比賽結果？")) return;
    setPending(true);
    const res = await fetch(`/api/events/${eventId}/match-result`, {
      method: "DELETE",
      credentials: "include",
    });
    setPending(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showError((data as { error?: string }).error ?? "清除失敗");
      return;
    }
    setSaved(null);
    setMode("edit");
    showSuccess("已清除");
    router.refresh();
  }

  if (mode === "view" && viewData) {
    return (
      <div className="space-y-4">
        <MatchResultVisualization data={viewData} teamName={teamName} />
        {canEdit ?
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
              onClick={() => setMode("edit")}
            >
              編輯結果
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
              onClick={() => void clearResult()}
            >
              清除
            </button>
          </div>
        : null}
      </div>
    );
  }

  if (!canEdit) {
    return <p className="text-sm text-zinc-500">比賽結束後可登錄比分與數據。</p>;
  }

  return (
    <div className="space-y-6">
      {viewData ?
        <MatchResultVisualization data={viewData} teamName={teamName} />
      : null}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1 text-sm">
            <span className="font-medium">對手名稱</span>
            <input
              value={opponentName}
              onChange={(e) => setOpponentName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="例如：XX 高中"
            />
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">各局比分</h3>
            {sets.length < 5 ?
              <button
                type="button"
                className="text-xs text-[var(--brand-primary)] hover:underline"
                onClick={() => setSets((s) => [...s, { our: "", opponent: "" }])}
              >
                + 新增一局
              </button>
            : null}
          </div>
          <div className="space-y-2">
            {sets.map((s, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2">
                <span className="w-14 text-xs text-zinc-500">第 {i + 1} 局</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={s.our}
                  placeholder="0"
                  onChange={(e) =>
                    setSets((prev) =>
                      prev.map((row, j) =>
                        j === i ?
                          { ...row, our: sanitizeNonNegativeIntInput(e.target.value) }
                        : row,
                      ),
                    )
                  }
                  className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm tabular-nums dark:border-zinc-700 dark:bg-zinc-950"
                />
                <span className="text-zinc-400">:</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={s.opponent}
                  placeholder="0"
                  onChange={(e) =>
                    setSets((prev) =>
                      prev.map((row, j) =>
                        j === i ?
                          { ...row, opponent: sanitizeNonNegativeIntInput(e.target.value) }
                        : row,
                      ),
                    )
                  }
                  className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm tabular-nums dark:border-zinc-700 dark:bg-zinc-950"
                />
                {sets.length > 1 ?
                  <button
                    type="button"
                    className="text-xs text-red-600 hover:underline"
                    onClick={() => setSets((prev) => prev.filter((_, j) => j !== i))}
                  >
                    移除
                  </button>
                : null}
              </div>
            ))}
          </div>
        </div>

        <MatchTeamStatsInputSection
          teamStats={teamStats}
          onChange={(key, value) =>
            setTeamStats((t) => ({ ...t, [key]: sanitizeNonNegativeIntInput(value) }))
          }
        />

        <MatchPlayerStatsInputSection playerRows={playerRows} onUpdateStat={updateStat} />

        <label className="block space-y-1 text-sm">
          <span className="font-medium">備註</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "儲存中…" : "儲存比賽結果"}
          </button>
          {viewData ?
            <button
              type="button"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
              onClick={() => setMode("view")}
            >
              取消
            </button>
          : null}
        </div>
      </form>
    </div>
  );
}
