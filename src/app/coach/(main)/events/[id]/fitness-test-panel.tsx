"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
  FitnessTestInputSection,
  applyFitnessAttemptUpdate,
} from "@/components/fitness-test-input-section";
import { useToast } from "@/components/toast-provider";
import {
  DEFAULT_EQUIPMENT_NOTE,
  DEFAULT_SHUTTLE_PROTOCOL,
  FITNESS_TEST_ITEMS,
  formatFitnessUnit,
  formatFitnessValue,
  hasAnyFitnessStats,
  normalizeFitnessStats,
  type FitnessTestItemKey,
  type FitnessTestPlayerRow,
  type FitnessTestStats,
} from "@/lib/fitness/test-schema";
import { buildFitnessEventCsv, downloadCsvFile } from "@/lib/fitness/export-csv";

export type FitnessTestViewData = {
  protocolNote: string | null;
  equipmentNote: string | null;
  notes: string | null;
  playerResults: FitnessTestPlayerRow[];
};

type Props = {
  eventId: string;
  eventTitle: string;
  eventDateLabel: string;
  canEdit: boolean;
  initial: FitnessTestViewData | null;
  roster: FitnessTestPlayerRow[];
};

function initPlayerMap(
  initial: FitnessTestViewData | null,
  roster: FitnessTestPlayerRow[],
): Map<string, FitnessTestPlayerRow> {
  const map = new Map<string, FitnessTestPlayerRow>();
  for (const r of roster) {
    const hit = initial?.playerResults.find((p) => p.memberId === r.memberId);
    map.set(r.memberId, {
      memberId: r.memberId,
      displayName: r.displayName,
      stats: hit ? normalizeFitnessStats(hit.stats) : r.stats,
    });
  }
  return map;
}

/** 教練：體能測試登錄（註解：事件結束後可編輯）。 */
export function FitnessTestPanel({ eventId, eventTitle, eventDateLabel, canEdit, initial, roster }: Props) {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [mode, setMode] = useState<"view" | "edit">(initial ? "view" : canEdit ? "edit" : "view");
  const [saved, setSaved] = useState<FitnessTestViewData | null>(initial);
  const [protocolNote, setProtocolNote] = useState(initial?.protocolNote ?? "");
  const [equipmentNote, setEquipmentNote] = useState(initial?.equipmentNote ?? DEFAULT_EQUIPMENT_NOTE);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [playerMap, setPlayerMap] = useState(() => initPlayerMap(initial, roster));
  const [pending, setPending] = useState(false);

  const playerRows = useMemo(() => Array.from(playerMap.values()), [playerMap]);

  const updateAttempt = useCallback(
    (memberId: string, itemKey: FitnessTestItemKey, attemptIndex: number, value: string) => {
      setPlayerMap((prev) => {
        const next = new Map(prev);
        const row = next.get(memberId);
        if (!row) return prev;
        next.set(memberId, {
          ...row,
          stats: applyFitnessAttemptUpdate(row.stats, itemKey, attemptIndex, value),
        });
        return next;
      });
    },
    [],
  );

  async function handleSave() {
    setPending(true);
    try {
      const res = await fetch(`/api/events/${eventId}/fitness-test`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocolNote: protocolNote.trim() || null,
          equipmentNote: equipmentNote.trim() || null,
          notes: notes.trim() || null,
          playerResults: playerRows
            .filter((p) => hasAnyFitnessStats(p.stats))
            .map((p) => ({
              memberId: p.memberId,
              stats: Object.fromEntries(
                FITNESS_TEST_ITEMS.map((item) => [
                  item.key,
                  { attempts: p.stats[item.key].attempts },
                ]),
              ),
            })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError((data as { error?: string }).error ?? `儲存失敗 (${res.status})`);
        setPending(false);
        return;
      }
      const session = (data as { session: { protocolNote: string | null; equipmentNote: string | null; notes: string | null; results: FitnessTestPlayerRow[] } }).session;
      const nextSaved: FitnessTestViewData = {
        protocolNote: session.protocolNote,
        equipmentNote: session.equipmentNote,
        notes: session.notes,
        playerResults: session.results.map((r) => ({
          memberId: r.memberId,
          displayName: r.displayName,
          stats: normalizeFitnessStats(r.stats),
        })),
      };
      setSaved(nextSaved);
      setPlayerMap(initPlayerMap(nextSaved, roster));
      setMode("view");
      showSuccess("已儲存體能測試數據");
      router.refresh();
    } catch {
      showError("網路錯誤");
    } finally {
      setPending(false);
    }
  }

  if (!canEdit && !saved) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        體能測試結束後，教練可在此登錄各隊員數據。
      </p>
    );
  }

  if (mode === "view" && saved) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">折返跑協議：</span>
            {saved.protocolNote?.trim() || DEFAULT_SHUTTLE_PROTOCOL}
          </p>
          {saved.equipmentNote ?
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">器材：</span>
              {saved.equipmentNote}
            </p>
          : null}
          {saved.notes ?
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">備註：</span>
              {saved.notes}
            </p>
          : null}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
                <th className="px-2 py-2">隊員</th>
                {FITNESS_TEST_ITEMS.map((item) => (
                  <th key={item.key} className="px-2 py-2">
                    {item.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {saved.playerResults.map((p) => (
                <tr key={p.memberId} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-2 py-2 font-medium">{p.displayName}</td>
                  {FITNESS_TEST_ITEMS.map((item) => (
                    <td key={item.key} className="px-2 py-2 tabular-nums">
                      {formatFitnessValue(p.stats[item.key].best, item.decimalPlaces)}
                      {p.stats[item.key].best != null ? formatFitnessUnit(item.unit) : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              const csv = buildFitnessEventCsv({
                eventTitle,
                eventDateLabel,
                protocolNote: saved.protocolNote,
                equipmentNote: saved.equipmentNote,
                notes: saved.notes,
                playerResults: saved.playerResults,
              });
              const safeTitle = eventTitle.replace(/[^\w\u4e00-\u9fff-]+/g, "_").slice(0, 40);
              downloadCsvFile(`體能測試_${safeTitle}.csv`, csv);
            }}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            匯出 CSV
          </button>
          {canEdit ?
            <button
              type="button"
              onClick={() => setMode("edit")}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              編輯
            </button>
          : null}
        </div>
      </div>
    );
  }

  if (!canEdit) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">尚無體能測試數據。</p>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">折返跑協議備註</span>
          <p className="mt-0.5 text-xs text-zinc-500">預設：{DEFAULT_SHUTTLE_PROTOCOL}</p>
          <input
            value={protocolNote}
            onChange={(e) => setProtocolNote(e.target.value)}
            placeholder="留空則使用預設協議"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">器材備註</span>
          <input
            value={equipmentNote}
            onChange={(e) => setEquipmentNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">場次備註</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
      </div>

      <FitnessTestInputSection playerRows={playerRows} onUpdateAttempt={updateAttempt} />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void handleSave()}
          className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "儲存中…" : "儲存體能數據"}
        </button>
        {saved ?
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMode("view");
              setPlayerMap(initPlayerMap(saved, roster));
              setProtocolNote(saved.protocolNote ?? "");
              setEquipmentNote(saved.equipmentNote ?? DEFAULT_EQUIPMENT_NOTE);
              setNotes(saved.notes ?? "");
            }}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
          >
            取消
          </button>
        : null}
      </div>
    </div>
  );
}
