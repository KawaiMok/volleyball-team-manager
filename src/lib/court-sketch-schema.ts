import { z } from "zod";

/** 目前寫入 DB 的版本（註解：v2 為全場 + 球員／排球標記 + 線段）。 */
export const COURT_SKETCH_VERSION = 2 as const;

/** v1 僅半場球員標記（註解：讀取時升級為 v2）。 */
const tokenSchemaV1 = z.object({
  id: z.string().min(1).max(40),
  label: z.string().max(8),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const courtSketchSchemaV1 = z.object({
  version: z.literal(1),
  tokens: z.array(tokenSchemaV1).max(12),
  notes: z.string().max(200).optional(),
});

/** token／線端點：x=場寬（9m 側向）、y=場長（18m 端線間）；顯示為橫向場時長度→水平、寬度→垂直（註解：見 courtNormToSvg）。 */
const playerTokenSchema = z.object({
  id: z.string().min(1).max(40),
  kind: z.literal("PLAYER"),
  label: z.string().max(8),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

const ballTokenSchema = z.object({
  id: z.string().min(1).max(40),
  kind: z.literal("BALL"),
  label: z.string().max(4).optional(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export const courtSketchTokenSchema = z.discriminatedUnion("kind", [playerTokenSchema, ballTokenSchema]);

const sketchLineSchema = z.object({
  id: z.string().min(1).max(40),
  x1: z.number().min(0).max(1),
  y1: z.number().min(0).max(1),
  x2: z.number().min(0).max(1),
  y2: z.number().min(0).max(1),
});

export const courtSketchSchema = z.object({
  version: z.literal(COURT_SKETCH_VERSION),
  tokens: z.array(courtSketchTokenSchema).max(24),
  lines: z.array(sketchLineSchema).max(40),
  notes: z.string().max(200).optional(),
});

export type CourtSketchToken = z.infer<typeof courtSketchTokenSchema>;
export type CourtSketchLine = z.infer<typeof sketchLineSchema>;
export type CourtSketchData = z.infer<typeof courtSketchSchema>;

export function emptyCourtSketch(): CourtSketchData {
  return {
    version: COURT_SKETCH_VERSION,
    tokens: [],
    lines: [],
  };
}

function migrateV1ToV2(v1: z.infer<typeof courtSketchSchemaV1>): CourtSketchData {
  return {
    version: COURT_SKETCH_VERSION,
    tokens: v1.tokens.map((t) => ({
      id: t.id,
      kind: "PLAYER" as const,
      label: t.label,
      x: t.x,
      /** v1 半場 y 對應全場我方大致下半（註解：粗略對齊）。 */
      y: 0.5 + t.y * 0.5,
    })),
    lines: [],
    notes: v1.notes,
  };
}

/** 解析 DB Json；v1 自動升級 v2（註解：無效回傳 null）。 */
export function parseCourtSketch(raw: unknown): CourtSketchData | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version === 2) {
    const r = courtSketchSchema.safeParse(raw);
    return r.success ? r.data : null;
  }
  if (o.version === 1) {
    const r = courtSketchSchemaV1.safeParse(raw);
    if (!r.success) return null;
    return migrateV1ToV2(r.data);
  }
  return null;
}
