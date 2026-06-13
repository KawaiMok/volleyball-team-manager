import type { CourtSketchData } from "@/lib/court-sketch-schema";
import { COURT_SKETCH_VERSION, emptyCourtSketch } from "@/lib/court-sketch-schema";

function mkPlayer(
  id: string,
  label: string,
  x: number,
  y: number,
): CourtSketchData["tokens"][number] {
  return { id, kind: "PLAYER" as const, label, x, y };
}

/**
 * 籃球即時戰術版：空白時補 5v5（對方 1–5、我方 A–E）（註解：不覆寫已儲存內容）。
 */
export function basketballLiveTacticalStarterTokens(sketch: CourtSketchData | null): CourtSketchData {
  const base = sketch ?? emptyCourtSketch();
  if (base.tokens.length > 0) return base;

  const tokens: CourtSketchData["tokens"] = [
    /** 對方半場 */
    mkPlayer("bb-opp-pg", "1", 0.5, 0.38),
    mkPlayer("bb-opp-sg", "2", 0.72, 0.32),
    mkPlayer("bb-opp-sf", "3", 0.28, 0.32),
    mkPlayer("bb-opp-pf", "4", 0.72, 0.15),
    mkPlayer("bb-opp-c", "5", 0.5, 0.1),
    /** 我方半場 */
    mkPlayer("bb-us-pg", "A", 0.5, 0.62),
    mkPlayer("bb-us-sg", "B", 0.72, 0.68),
    mkPlayer("bb-us-sf", "C", 0.28, 0.68),
    mkPlayer("bb-us-pf", "D", 0.72, 0.85),
    mkPlayer("bb-us-c", "E", 0.5, 0.9),
  ];

  return { version: COURT_SKETCH_VERSION, tokens, lines: base.lines, notes: base.notes };
}
