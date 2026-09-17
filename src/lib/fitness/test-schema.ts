import { z } from "zod";

/** 體能測試項目 key（註解：與設計文件 §2 對齊）。 */
export type FitnessTestItemKey =
  | "squatJump"
  | "cmj"
  | "approachJump"
  | "depthJump"
  | "courtShuttle"
  | "medicineBallThrow";

export type FitnessTestUnit = "cm" | "sec" | "m";

export type FitnessTestItem = {
  attempts: (number | null)[];
  best: number | null;
  unit: FitnessTestUnit;
};

export type FitnessTestStats = Record<FitnessTestItemKey, FitnessTestItem>;

export type FitnessTestPlayerRow = {
  memberId: string;
  displayName: string;
  stats: FitnessTestStats;
  /** 當場身高 cm（註解：每次體能測驗獨立紀錄）。 */
  heightCm: number | null;
  /** 當場體重 kg（註解：每次體能測驗獨立紀錄）。 */
  weightKg: number | null;
};

/** 身高／體重小數位（註解：cm、kg 各 1 位）。 */
export const FITNESS_HEIGHT_DECIMAL_PLACES = 1;
export const FITNESS_WEIGHT_DECIMAL_PLACES = 1;

export const fitnessHeightCmSchema = z.number().min(100).max(250).nullable();
export const fitnessWeightKgSchema = z.number().min(25).max(200).nullable();

/** 正規化身高／體重（註解：無效值回 null）。 */
export function compactBodyMetric(
  value: number | null | undefined,
  decimalPlaces: number,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  const rounded = Number(value.toFixed(decimalPlaces));
  if (!Number.isFinite(rounded)) return null;
  return rounded;
}

export function compactHeightCm(value: number | null | undefined): number | null {
  const n = compactBodyMetric(value, FITNESS_HEIGHT_DECIMAL_PLACES);
  if (n == null) return null;
  return fitnessHeightCmSchema.safeParse(n).success ? n : null;
}

export function compactWeightKg(value: number | null | undefined): number | null {
  const n = compactBodyMetric(value, FITNESS_WEIGHT_DECIMAL_PLACES);
  if (n == null) return null;
  return fitnessWeightKgSchema.safeParse(n).success ? n : null;
}

/** 顯示身高／體重（註解：null 顯示 —）。 */
export function formatBodyMetric(value: number | null, unit: "cm" | "kg"): string {
  if (value == null) return "—";
  const places = unit === "cm" ? FITNESS_HEIGHT_DECIMAL_PLACES : FITNESS_WEIGHT_DECIMAL_PLACES;
  return `${value.toFixed(places)}${unit}`;
}

/** 是否至少有一筆可儲存數據（註解：含身高／體重或所選測試項目）。 */
export function hasAnyFitnessResultRow(
  row: Pick<FitnessTestPlayerRow, "stats" | "heightCm" | "weightKg">,
  itemKeys: readonly FitnessTestItemKey[] = DEFAULT_FITNESS_TEST_ITEM_KEYS,
): boolean {
  return (
    hasAnyFitnessStats(row.stats, itemKeys) ||
    row.heightCm != null ||
    row.weightKg != null
  );
}

export function emptyFitnessPlayerRow(memberId: string, displayName: string): FitnessTestPlayerRow {
  return {
    memberId,
    displayName,
    stats: emptyFitnessStats(),
    heightCm: null,
    weightKg: null,
  };
}

/** 各項目定義（註解：attemptCount 固定；best 由 server 計算）。 */
export const FITNESS_TEST_ITEMS: readonly {
  key: FitnessTestItemKey;
  label: string;
  unit: FitnessTestUnit;
  attemptCount: number;
  /** 越大越好（折返跑為 false） */
  higherIsBetter: boolean;
  decimalPlaces: number;
  /** 橫向比較圖固定刻度下限 */
  chartScaleMin: number;
  /** 橫向比較圖固定刻度上限（註解：跳類 0–100cm、藥球 0–10m、折返 0–50s） */
  chartScaleMax: number;
}[] = [
  {
    key: "squatJump",
    label: "深蹲跳",
    unit: "cm",
    attemptCount: 3,
    higherIsBetter: true,
    decimalPlaces: 1,
    chartScaleMin: 0,
    chartScaleMax: 100,
  },
  {
    key: "cmj",
    label: "停頓跳",
    unit: "cm",
    attemptCount: 3,
    higherIsBetter: true,
    decimalPlaces: 1,
    chartScaleMin: 0,
    chartScaleMax: 100,
  },
  {
    key: "approachJump",
    label: "助跑跳",
    unit: "cm",
    attemptCount: 3,
    higherIsBetter: true,
    decimalPlaces: 1,
    chartScaleMin: 0,
    chartScaleMax: 100,
  },
  {
    key: "depthJump",
    label: "深度跳",
    unit: "cm",
    attemptCount: 3,
    higherIsBetter: true,
    decimalPlaces: 1,
    chartScaleMin: 0,
    chartScaleMax: 100,
  },
  {
    key: "courtShuttle",
    label: "排球場折返跑",
    unit: "sec",
    attemptCount: 1,
    higherIsBetter: false,
    decimalPlaces: 2,
    chartScaleMin: 0,
    chartScaleMax: 50,
  },
  {
    key: "medicineBallThrow",
    label: "雙手擲藥球",
    unit: "m",
    attemptCount: 3,
    higherIsBetter: true,
    decimalPlaces: 2,
    chartScaleMin: 0,
    chartScaleMax: 10,
  },
] as const;

export const FITNESS_TEST_ITEM_BY_KEY = Object.fromEntries(
  FITNESS_TEST_ITEMS.map((item) => [item.key, item]),
) as Record<FitnessTestItemKey, (typeof FITNESS_TEST_ITEMS)[number]>;

/** 橫向比較圖刻度標籤（註解：如 0–100、0–50）。 */
export function fitnessChartScaleLabel(key: FitnessTestItemKey): string {
  const def = FITNESS_TEST_ITEM_BY_KEY[key];
  return `${def.chartScaleMin}–${def.chartScaleMax}`;
}

/** 依固定刻度計算柱寬比例 0–1（註解：折返跑越小柱越長）。 */
export function fitnessChartBarRatio(key: FitnessTestItemKey, value: number): number {
  const def = FITNESS_TEST_ITEM_BY_KEY[key];
  const range = def.chartScaleMax - def.chartScaleMin;
  if (range <= 0 || !Number.isFinite(value)) return 0;
  const clamped = Math.min(def.chartScaleMax, Math.max(def.chartScaleMin, value));
  if (def.higherIsBetter) {
    return (clamped - def.chartScaleMin) / range;
  }
  return (def.chartScaleMax - clamped) / range;
}

/** 預設全部 6 項（註解：fitnessTestItemKeys 為 null 時視同此列表）。 */
export const DEFAULT_FITNESS_TEST_ITEM_KEYS: FitnessTestItemKey[] = FITNESS_TEST_ITEMS.map(
  (item) => item.key,
);

const fitnessTestItemKeySchema = z.enum([
  "squatJump",
  "cmj",
  "approachJump",
  "depthJump",
  "courtShuttle",
  "medicineBallThrow",
]);

/** API／表單：至少選 1 項體能測試。 */
export const fitnessTestItemKeysSchema = z.array(fitnessTestItemKeySchema).min(1);

/** 正規化事件所選項目（註解：無效或空陣列時回退為全部 6 項；順序依 FITNESS_TEST_ITEMS）。 */
export function normalizeFitnessTestItemKeys(raw: unknown): FitnessTestItemKey[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [...DEFAULT_FITNESS_TEST_ITEM_KEYS];
  }
  const valid = new Set<FitnessTestItemKey>(DEFAULT_FITNESS_TEST_ITEM_KEYS);
  const picked = raw.filter(
    (k): k is FitnessTestItemKey => typeof k === "string" && valid.has(k as FitnessTestItemKey),
  );
  if (picked.length === 0) {
    return [...DEFAULT_FITNESS_TEST_ITEM_KEYS];
  }
  return DEFAULT_FITNESS_TEST_ITEM_KEYS.filter((k) => picked.includes(k));
}

/** 依 key 列表取得項目定義（註解：供 UI 只顯示所選測試）。 */
export function resolveFitnessTestItems(keys?: FitnessTestItemKey[] | null) {
  const normalized = keys?.length ? normalizeFitnessTestItemKeys(keys) : DEFAULT_FITNESS_TEST_ITEM_KEYS;
  return FITNESS_TEST_ITEMS.filter((item) => normalized.includes(item.key));
}

/** 僅保留所選項目的 stats（註解：儲存前剔除未選項目數據）。 */
export function filterStatsToSelectedKeys(
  stats: FitnessTestStats,
  keys: FitnessTestItemKey[],
): FitnessTestStats {
  const result = emptyFitnessStats();
  for (const key of keys) {
    result[key] = stats[key];
  }
  return result;
}

/** v1 預設折返跑協議文案（註解：可由 session.protocolNote 覆寫）。 */
export const DEFAULT_SHUTTLE_PROTOCOL =
  "排球場端線折返跑（1 趟）：自一端端線出發，跑至對面端線觸線後折返，回到出發端線觸線停止。";

/** v1 預設藥球器材文案。 */
export const DEFAULT_EQUIPMENT_NOTE = "藥球 3 kg（雙手過頭向前擲）";

const jumpCmSchema = z.number().min(0).max(150).nullable();
const shuttleSecSchema = z.number().min(1).max(300).nullable();
const throwMSchema = z.number().min(0).max(30).nullable();

const valueSchemaByKey: Record<FitnessTestItemKey, z.ZodNullable<z.ZodNumber>> = {
  squatJump: jumpCmSchema,
  cmj: jumpCmSchema,
  approachJump: jumpCmSchema,
  depthJump: jumpCmSchema,
  courtShuttle: shuttleSecSchema,
  medicineBallThrow: throwMSchema,
};

function attemptsSchemaForKey(key: FitnessTestItemKey) {
  const count = FITNESS_TEST_ITEM_BY_KEY[key].attemptCount;
  const valueSchema = valueSchemaByKey[key];
  return z.tuple(Array.from({ length: count }, () => valueSchema) as [z.ZodNullable<z.ZodNumber>, ...z.ZodNullable<z.ZodNumber>[]]);
}

/** PUT body 中單項：僅 attempts（註解：best 由 server 計算）。 */
const fitnessTestItemInputSchema = z.object({
  attempts: z.array(z.number().nullable()),
});

/** 客戶端提交的 stats（僅 attempts）。 */
export const fitnessTestStatsInputSchema = z.object({
  squatJump: fitnessTestItemInputSchema,
  cmj: fitnessTestItemInputSchema,
  approachJump: fitnessTestItemInputSchema,
  depthJump: fitnessTestItemInputSchema,
  courtShuttle: fitnessTestItemInputSchema,
  medicineBallThrow: fitnessTestItemInputSchema,
});

export const fitnessTestPutBodySchema = z.object({
  protocolNote: z.string().nullable().optional(),
  equipmentNote: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  playerResults: z.array(
    z.object({
      memberId: z.string().min(1),
      stats: fitnessTestStatsInputSchema,
      heightCm: fitnessHeightCmSchema.optional(),
      weightKg: fitnessWeightKgSchema.optional(),
    }),
  ),
});

export type FitnessTestPutBody = z.infer<typeof fitnessTestPutBodySchema>;

/** 計算單項 best（註解：跳高／藥球取 max；折返跑取唯一值）。 */
export function computeItemBest(key: FitnessTestItemKey, attempts: (number | null)[]): number | null {
  const values = attempts.filter((v): v is number => v != null);
  if (values.length === 0) return null;
  const def = FITNESS_TEST_ITEM_BY_KEY[key];
  return def.higherIsBetter ? Math.max(...values) : values[0] ?? null;
}

/** 正規化 attempts 長度並計算 best + unit。 */
export function compactFitnessItem(key: FitnessTestItemKey, rawAttempts: (number | null)[]): FitnessTestItem {
  const def = FITNESS_TEST_ITEM_BY_KEY[key];
  const attempts = Array.from({ length: def.attemptCount }, (_, i) => {
    const v = rawAttempts[i];
    if (v == null) return null;
    const rounded = Number(v.toFixed(def.decimalPlaces));
    return Number.isFinite(rounded) ? rounded : null;
  });
  return {
    attempts,
    best: computeItemBest(key, attempts),
    unit: def.unit,
  };
}

export function compactFitnessStats(raw: z.infer<typeof fitnessTestStatsInputSchema>): FitnessTestStats {
  return {
    squatJump: compactFitnessItem("squatJump", raw.squatJump.attempts),
    cmj: compactFitnessItem("cmj", raw.cmj.attempts),
    approachJump: compactFitnessItem("approachJump", raw.approachJump.attempts),
    depthJump: compactFitnessItem("depthJump", raw.depthJump.attempts),
    courtShuttle: compactFitnessItem("courtShuttle", raw.courtShuttle.attempts),
    medicineBallThrow: compactFitnessItem("medicineBallThrow", raw.medicineBallThrow.attempts),
  };
}

export function emptyFitnessStats(): FitnessTestStats {
  return Object.fromEntries(
    FITNESS_TEST_ITEMS.map((item) => [
      item.key,
      { attempts: Array.from({ length: item.attemptCount }, () => null), best: null, unit: item.unit },
    ]),
  ) as FitnessTestStats;
}

/** 正規化 DB JSON（註解：補齊缺欄與 attempts 長度）。 */
export function normalizeFitnessStats(raw: unknown): FitnessTestStats {
  const base = emptyFitnessStats();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const item of FITNESS_TEST_ITEMS) {
    const hit = obj[item.key];
    if (!hit || typeof hit !== "object") continue;
    const attemptsRaw = (hit as { attempts?: unknown }).attempts;
    const attempts = Array.isArray(attemptsRaw) ?
        Array.from({ length: item.attemptCount }, (_, i) => {
          const v = attemptsRaw[i];
          return typeof v === "number" && Number.isFinite(v) ? v : null;
        })
      : Array.from({ length: item.attemptCount }, () => null);
    base[item.key] = compactFitnessItem(item.key, attempts);
  }
  return base;
}

/** 是否至少有一項有紀錄（註解：可限定只檢查所選項目）。 */
export function hasAnyFitnessStats(
  stats: FitnessTestStats,
  itemKeys: readonly FitnessTestItemKey[] = DEFAULT_FITNESS_TEST_ITEM_KEYS,
): boolean {
  return itemKeys.some((key) => stats[key].best != null);
}

/** 列表摘要（註解：手機 roster 列 preview；可限定所選項目）。 */
export function fitnessOverallSummary(
  stats: FitnessTestStats,
  itemKeys: readonly FitnessTestItemKey[] = DEFAULT_FITNESS_TEST_ITEM_KEYS,
): string {
  const items = resolveFitnessTestItems([...itemKeys]);
  const parts = items.filter((item) => stats[item.key].best != null).map((item) => {
    const best = stats[item.key].best!;
    const unit = item.unit === "sec" ? "s" : item.unit;
    return `${item.label} ${best}${unit}`;
  });
  return parts.length > 0 ? parts.join(" · ") : "尚未填寫";
}

/** 驗證 PUT stats 格式（註解：attempts 長度須符合各項目）。 */
export function parseFitnessStatsInput(raw: unknown): z.infer<typeof fitnessTestStatsInputSchema> | null {
  const parsed = fitnessTestStatsInputSchema.safeParse(raw);
  if (!parsed.success) return null;
  for (const item of FITNESS_TEST_ITEMS) {
    if (parsed.data[item.key].attempts.length !== item.attemptCount) return null;
    const schema = attemptsSchemaForKey(item.key);
    if (!schema.safeParse(parsed.data[item.key].attempts).success) return null;
  }
  return parsed.data;
}

/** 顯示數值（註解：null 顯示 —）。 */
export function formatFitnessValue(value: number | null, decimalPlaces: number): string {
  if (value == null) return "—";
  return value.toFixed(decimalPlaces);
}

/** 顯示單位後綴。 */
export function formatFitnessUnit(unit: FitnessTestUnit): string {
  switch (unit) {
    case "cm":
      return "cm";
    case "sec":
      return "s";
    case "m":
      return "m";
  }
}
