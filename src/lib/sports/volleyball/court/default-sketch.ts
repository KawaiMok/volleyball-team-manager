import type { CourtSketchData } from "@/lib/court-sketch-schema";
import { COURT_SKETCH_VERSION, emptyCourtSketch } from "@/lib/court-sketch-schema";

/** 對方：後排／前排（場長 y，左端線→網） */
const OPP_ROWS_Y = [0.2, 0.36] as const;
/** 我方：前排（近網）／後排（近端線） */
const US_ROWS_Y = [0.64, 0.8] as const;
const COLS_X = [0.18, 0.5, 0.82] as const;

/**
 * 排球即時戰術版：若尚無 token，補雙方各 6 人（對方 1–6、我方 A–F）（註解：不覆寫已儲存內容）。
 */
export function volleyballLiveTacticalStarterTokens(sketch: CourtSketchData | null): CourtSketchData {
  const base = sketch ?? emptyCourtSketch();
  if (base.tokens.length > 0) {
    return base;
  }

  const mkPlayer = (
    id: string,
    label: string,
    xNorm: number,
    yNorm: number,
  ): CourtSketchData["tokens"][number] => ({
    id,
    kind: "PLAYER" as const,
    label,
    x: xNorm,
    y: yNorm,
  });

  const tokens: CourtSketchData["tokens"] = [];
  const oppLabels = ["1", "2", "3", "4", "5", "6"] as const;
  let oi = 0;
  for (const y of OPP_ROWS_Y) {
    for (const x of COLS_X) {
      tokens.push(mkPlayer(`live-tactical-opp-${oi + 1}`, oppLabels[oi], x, y));
      oi += 1;
    }
  }

  const ourLabels = ["A", "B", "C", "D", "E", "F"] as const;
  let ui = 0;
  for (const y of US_ROWS_Y) {
    for (const x of COLS_X) {
      tokens.push(mkPlayer(`live-tactical-us-${ourLabels[ui]}`, ourLabels[ui], x, y));
      ui += 1;
    }
  }

  return {
    version: COURT_SKETCH_VERSION,
    tokens,
    lines: base.lines,
    notes: base.notes,
  };
}
