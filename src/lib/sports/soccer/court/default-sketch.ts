import type { CourtSketchData } from "@/lib/court-sketch-schema";
import { COURT_SKETCH_VERSION, emptyCourtSketch } from "@/lib/court-sketch-schema";

/** 4-4-2 橫向四後衛（註解：x 為場寬、y 為場長） */
const BACK_X = [0.12, 0.38, 0.62, 0.88] as const;

function mkPlayer(
  id: string,
  label: string,
  x: number,
  y: number,
): CourtSketchData["tokens"][number] {
  return { id, kind: "PLAYER" as const, label, x, y };
}

/**
 * 足球即時戰術版：空白時補 4-4-2（對方 1–11、我方 A–K）（註解：不覆寫已儲存內容）。
 */
export function soccerLiveTacticalStarterTokens(sketch: CourtSketchData | null): CourtSketchData {
  const base = sketch ?? emptyCourtSketch();
  if (base.tokens.length > 0) return base;

  const tokens: CourtSketchData["tokens"] = [];

  /** 對方半場（y < 0.5） */
  tokens.push(mkPlayer("soc-opp-gk", "1", 0.5, 0.06));
  BACK_X.forEach((x, i) => tokens.push(mkPlayer(`soc-opp-def-${i}`, String(i + 2), x, 0.18)));
  BACK_X.forEach((x, i) => tokens.push(mkPlayer(`soc-opp-mid-${i}`, String(i + 6), x, 0.3)));
  tokens.push(mkPlayer("soc-opp-fwd-1", "10", 0.35, 0.42));
  tokens.push(mkPlayer("soc-opp-fwd-2", "11", 0.65, 0.42));

  /** 我方半場（y > 0.5） */
  const ourLabels = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"] as const;
  let li = 0;
  tokens.push(mkPlayer("soc-us-gk", ourLabels[li++], 0.5, 0.94));
  BACK_X.forEach((x) => tokens.push(mkPlayer(`soc-us-def-${li}`, ourLabels[li++], x, 0.82)));
  BACK_X.forEach((x) => tokens.push(mkPlayer(`soc-us-mid-${li}`, ourLabels[li++], x, 0.7)));
  tokens.push(mkPlayer("soc-us-fwd-1", ourLabels[li++], 0.35, 0.58));
  tokens.push(mkPlayer("soc-us-fwd-2", ourLabels[li], 0.65, 0.58));

  return { version: COURT_SKETCH_VERSION, tokens, lines: base.lines, notes: base.notes };
}
