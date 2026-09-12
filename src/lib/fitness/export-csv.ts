import type { MemberFitnessTrendRow } from "@/lib/fitness/aggregate";
import {
  FITNESS_TEST_ITEMS,
  formatFitnessUnit,
  formatFitnessValue,
  type FitnessTestPlayerRow,
} from "@/lib/fitness/test-schema";

/** 跳脫 CSV 儲存格（註解：處理逗號、引號、換行）。 */
function escapeCsvCell(value: string | number | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCsvCell).join(",");
}

/** 觸發瀏覽器下載 CSV（註解：僅 client 端使用）。 */
export function downloadCsvFile(filename: string, content: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

type EventCsvInput = {
  eventTitle: string;
  eventDateLabel: string;
  protocolNote: string | null;
  equipmentNote: string | null;
  notes: string | null;
  playerResults: FitnessTestPlayerRow[];
};

/** 單場體能測試 CSV（註解：含各次嘗試 + best）。 */
export function buildFitnessEventCsv(input: EventCsvInput): string {
  const lines: string[] = [];
  lines.push(csvRow(["事件", input.eventTitle]));
  lines.push(csvRow(["日期", input.eventDateLabel]));
  if (input.protocolNote?.trim()) {
    lines.push(csvRow(["折返跑協議", input.protocolNote.trim()]));
  }
  if (input.equipmentNote?.trim()) {
    lines.push(csvRow(["器材", input.equipmentNote.trim()]));
  }
  if (input.notes?.trim()) {
    lines.push(csvRow(["備註", input.notes.trim()]));
  }
  lines.push("");

  const headers = ["隊員"];
  for (const item of FITNESS_TEST_ITEMS) {
    for (let i = 0; i < item.attemptCount; i++) {
      headers.push(`${item.label}_第${i + 1}次(${item.unit})`);
    }
    headers.push(`${item.label}_最佳(${item.unit})`);
  }
  lines.push(csvRow(headers));

  for (const player of input.playerResults) {
    const row: (string | number | null)[] = [player.displayName];
    for (const item of FITNESS_TEST_ITEMS) {
      const stat = player.stats[item.key];
      for (let i = 0; i < item.attemptCount; i++) {
        const v = stat.attempts[i];
        row.push(v != null ? formatFitnessValue(v, item.decimalPlaces) : "");
      }
      row.push(
        stat.best != null ? formatFitnessValue(stat.best, item.decimalPlaces) : "",
      );
    }
    lines.push(csvRow(row));
  }

  return lines.join("\n");
}

/** 隊伍體能趨勢 CSV（註解：最新 best + 與上一場 Δ）。 */
export function buildFitnessTrendCsv(rows: MemberFitnessTrendRow[]): string {
  const headers = ["隊員", "背號", "分隊", "場次數"];
  for (const item of FITNESS_TEST_ITEMS) {
    headers.push(`${item.label}_最新(${item.unit})`);
    headers.push(`${item.label}_Δ(${item.unit})`);
  }
  const lines = [csvRow(headers)];

  for (const r of rows) {
    const row: (string | number | null)[] = [
      r.displayName,
      r.jerseyNumber ?? "",
      r.squad ?? "",
      r.sessionCount || "",
    ];
    for (const item of FITNESS_TEST_ITEMS) {
      const best = r.latest?.stats[item.key].best ?? null;
      const delta = r.deltas[item.key];
      row.push(best != null ? formatFitnessValue(best, item.decimalPlaces) : "");
      if (delta != null && Number.isFinite(delta)) {
        const sign = delta > 0 ? "+" : "";
        row.push(`${sign}${delta.toFixed(item.decimalPlaces)}${formatFitnessUnit(item.unit)}`);
      } else {
        row.push("");
      }
    }
    lines.push(csvRow(row));
  }

  return lines.join("\n");
}
