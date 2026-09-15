"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import {
  FitnessTestInputSection,
  applyFitnessAttemptUpdate,
} from "@/components/fitness-test-input-section";
import { useToast } from "@/components/toast-provider";
import {
  DEFAULT_EQUIPMENT_NOTE,
  DEFAULT_FITNESS_TEST_ITEM_KEYS,
  DEFAULT_SHUTTLE_PROTOCOL,
  FITNESS_HEIGHT_DECIMAL_PLACES,
  FITNESS_WEIGHT_DECIMAL_PLACES,
  emptyFitnessStats,
  formatBodyMetric,
  formatFitnessUnit,
  formatFitnessValue,
  normalizeFitnessStats,
  resolveFitnessTestItems,
  type FitnessTestItemKey,
  type FitnessTestPlayerRow,
} from "@/lib/fitness/test-schema";
import { parseDecimalOrNull } from "@/lib/numeric-input";
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
  selectedItemKeys: FitnessTestItemKey[];
};

type SessionResponse = {
  protocolNote: string | null;
  equipmentNote: string | null;
  notes: string | null;
  results: FitnessTestPlayerRow[];
};

function clonePlayerRow(row: FitnessTestPlayerRow): FitnessTestPlayerRow {
  return {
    ...row,
    stats: normalizeFitnessStats(row.stats),
  };
}

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
      heightCm: hit?.heightCm ?? null,
      weightKg: hit?.weightKg ?? null,
    });
  }
  return map;
}

function sessionToViewData(session: SessionResponse): FitnessTestViewData {
  return {
    protocolNote: session.protocolNote,
    equipmentNote: session.equipmentNote,
    notes: session.notes,
    playerResults: session.results.map((r) => ({
      memberId: r.memberId,
      displayName: r.displayName,
      stats: normalizeFitnessStats(r.stats),
      heightCm: r.heightCm ?? null,
      weightKg: r.weightKg ?? null,
    })),
  };
}

function buildPlayerPayload(
  player: FitnessTestPlayerRow,
  selectedItemKeys: FitnessTestItemKey[],
): {
  memberId: string;
  heightCm: number | null;
  weightKg: number | null;
  stats: Record<string, { attempts: (number | null)[] }>;
} {
  const empty = emptyFitnessStats();
  return {
    memberId: player.memberId,
    heightCm: player.heightCm,
    weightKg: player.weightKg,
    stats: Object.fromEntries(
      DEFAULT_FITNESS_TEST_ITEM_KEYS.map((key) => [
        key,
        {
          attempts:
            selectedItemKeys.includes(key) ?
              player.stats[key].attempts
            : empty[key].attempts,
        },
      ]),
    ),
  };
}

/** 體能測試：項目備註可摺疊區（註解：預設收合，節省登錄畫面空間）。 */
function FitnessNotesCollapsible({
  open,
  onToggle,
  hasContent,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  hasContent: boolean;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
      >
        <span className="flex-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">項目備註</span>
        {!open && hasContent ?
          <span className="text-xs text-zinc-500 dark:text-zinc-400">已填寫</span>
        : null}
        <span
          className={`shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {open ?
        <div className="space-y-3 border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-zinc-800">
          {children}
        </div>
      : null}
    </div>
  );
}

/** 教練：體能測試登錄（註解：逐球員 popup 完成即儲存，支援多教練並行）。 */
export function FitnessTestPanel({
  eventId,
  eventTitle,
  eventDateLabel,
  canEdit,
  initial,
  roster,
  selectedItemKeys,
}: Props) {
  const items = useMemo(() => resolveFitnessTestItems(selectedItemKeys), [selectedItemKeys]);
  const showShuttleProtocol = selectedItemKeys.includes("courtShuttle");
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [mode, setMode] = useState<"view" | "edit">(initial ? "view" : canEdit ? "edit" : "view");
  const [saved, setSaved] = useState<FitnessTestViewData | null>(initial);
  const [protocolNote, setProtocolNote] = useState(initial?.protocolNote ?? "");
  const [equipmentNote, setEquipmentNote] = useState(initial?.equipmentNote ?? DEFAULT_EQUIPMENT_NOTE);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [playerMap, setPlayerMap] = useState(() => initPlayerMap(initial, roster));
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);

  const playerRows = useMemo(() => Array.from(playerMap.values()), [playerMap]);

  const hasNotesContent = useMemo(() => {
    const hasProtocol = showShuttleProtocol && protocolNote.trim() !== "";
    const hasEquipment =
      selectedItemKeys.includes("medicineBallThrow") &&
      equipmentNote.trim() !== "" &&
      equipmentNote.trim() !== DEFAULT_EQUIPMENT_NOTE.trim();
    const hasSessionNotes = notes.trim() !== "";
    return hasProtocol || hasEquipment || hasSessionNotes;
  }, [equipmentNote, notes, protocolNote, selectedItemKeys, showShuttleProtocol]);

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

  const updateBodyMetric = useCallback(
    (memberId: string, field: "heightCm" | "weightKg", value: string) => {
      setPlayerMap((prev) => {
        const next = new Map(prev);
        const row = next.get(memberId);
        if (!row) return prev;
        const parsed = parseDecimalOrNull(
          value,
          field === "heightCm" ? FITNESS_HEIGHT_DECIMAL_PLACES : FITNESS_WEIGHT_DECIMAL_PLACES,
        );
        next.set(memberId, { ...row, [field]: parsed });
        return next;
      });
    },
    [],
  );

  const revertPlayer = useCallback((row: FitnessTestPlayerRow) => {
    setPlayerMap((prev) => {
      const next = new Map(prev);
      next.set(row.memberId, clonePlayerRow(row));
      return next;
    });
  }, []);

  const savePlayer = useCallback(
    async (memberId: string): Promise<boolean> => {
      const player = playerMap.get(memberId);
      if (!player) return false;

      setSavingMemberId(memberId);
      try {
        const res = await fetch(`/api/events/${eventId}/fitness-test`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            protocolNote: protocolNote.trim() || null,
            equipmentNote: equipmentNote.trim() || null,
            notes: notes.trim() || null,
            playerResults: [buildPlayerPayload(player, selectedItemKeys)],
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showError((data as { error?: string }).error ?? `儲存失敗 (${res.status})`);
          return false;
        }
        const session = (data as { session: SessionResponse }).session;
        const nextSaved = sessionToViewData(session);
        setSaved(nextSaved);
        setPlayerMap(initPlayerMap(nextSaved, roster));
        setProtocolNote(session.protocolNote ?? "");
        setEquipmentNote(session.equipmentNote ?? DEFAULT_EQUIPMENT_NOTE);
        setNotes(session.notes ?? "");
        showSuccess(`已儲存 ${player.displayName} 的體能數據`);
        router.refresh();
        return true;
      } catch {
        showError("網路錯誤");
        return false;
      } finally {
        setSavingMemberId(null);
      }
    },
    [eventId, equipmentNote, notes, playerMap, protocolNote, roster, router, selectedItemKeys, showError, showSuccess],
  );

  function returnToView() {
    if (saved) {
      setPlayerMap(initPlayerMap(saved, roster));
      setProtocolNote(saved.protocolNote ?? "");
      setEquipmentNote(saved.equipmentNote ?? DEFAULT_EQUIPMENT_NOTE);
      setNotes(saved.notes ?? "");
    }
    setMode("view");
  }

  if (!canEdit && !saved) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        事件發布且測試開始後，教練可在此登錄各隊員數據。
      </p>
    );
  }

  if (mode === "view" && saved) {
    const viewHasNotesSection =
      showShuttleProtocol ||
      (selectedItemKeys.includes("medicineBallThrow") && !!saved.equipmentNote?.trim()) ||
      !!saved.notes?.trim();
    const viewHasCustomNotes =
      !!saved.protocolNote?.trim() ||
      !!saved.equipmentNote?.trim() ||
      !!saved.notes?.trim();

    return (
      <div className="space-y-4">
        {viewHasNotesSection ?
          <FitnessNotesCollapsible
            open={notesOpen}
            onToggle={() => setNotesOpen((v) => !v)}
            hasContent={viewHasCustomNotes}
          >
            <div className="space-y-2 text-sm">
              {showShuttleProtocol ?
                <p className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">折返跑協議：</span>
                  {saved.protocolNote?.trim() || DEFAULT_SHUTTLE_PROTOCOL}
                </p>
              : null}
              {selectedItemKeys.includes("medicineBallThrow") && saved.equipmentNote ?
                <p className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">器材：</span>
                  {saved.equipmentNote}
                </p>
              : null}
              {saved.notes ?
                <p className="text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">備註：</span>
                  {saved.notes}
                </p>
              : null}
            </div>
          </FitnessNotesCollapsible>
        : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800">
                <th className="px-2 py-2">隊員</th>
                <th className="px-2 py-2">身高</th>
                <th className="px-2 py-2">體重</th>
                {items.map((item) => (
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
                  <td className="px-2 py-2 tabular-nums">{formatBodyMetric(p.heightCm, "cm")}</td>
                  <td className="px-2 py-2 tabular-nums">{formatBodyMetric(p.weightKg, "kg")}</td>
                  {items.map((item) => (
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
                selectedItemKeys,
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
      {saved ?
        <div className="flex justify-end">
          <button
            type="button"
            onClick={returnToView}
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            返回檢視
          </button>
        </div>
      : null}

      <FitnessNotesCollapsible
        open={notesOpen}
        onToggle={() => setNotesOpen((v) => !v)}
        hasContent={hasNotesContent}
      >
        {showShuttleProtocol ?
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
        : null}
        {selectedItemKeys.includes("medicineBallThrow") ?
          <label className="block text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">器材備註</span>
            <input
              value={equipmentNote}
              onChange={(e) => setEquipmentNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
        : null}
        <label className="block text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">場次備註</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
          />
        </label>
      </FitnessNotesCollapsible>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        點選球員填寫後，按 popup「完成」即儲存該員數據；多教練可分開填不同球員。
      </p>

      <FitnessTestInputSection
        playerRows={playerRows}
        onUpdateAttempt={updateAttempt}
        onUpdateBodyMetric={updateBodyMetric}
        onSavePlayer={savePlayer}
        onRevertPlayer={revertPlayer}
        savingMemberId={savingMemberId}
        selectedItemKeys={selectedItemKeys}
      />
    </div>
  );
}
