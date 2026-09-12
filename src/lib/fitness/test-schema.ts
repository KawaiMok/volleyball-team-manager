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
};

/** 各項目定義（註解：attemptCount 固定；best 由 server 計算）。 */
export const FITNESS_TEST_ITEMS: readonly {
  key: FitnessTestItemKey;
  label: string;
  unit: FitnessTestUnit;
  attemptCount: number;
  /** 越大越好（折返跑為 false） */
  higherIsBetter: boolean;
  decimalPlaces: number;
}[] = [
  { key: "squatJump", label: "深蹲跳", unit: "cm", attemptCount: 3, higherIsBetter: true, decimalPlaces: 1 },
  { key: "cmj", label: "CMJ", unit: "cm", attemptCount: 3, higherIsBetter: true, decimalPlaces: 1 },
  { key: "approachJump", label: "助跑跳", unit: "cm", attemptCount: 3, higherIsBetter: true, decimalPlaces: 1 },
  { key: "depthJump", label: "深度跳", unit: "cm", attemptCount: 3, higherIsBetter: true, decimalPlaces: 1 },
  {
    key: "courtShuttle",
    label: "排球場折返跑",
    unit: "sec",
    attemptCount: 1,
    higherIsBetter: false,
    decimalPlaces: 2,
  },
  {
    key: "medicineBallThrow",
    label: "雙手擲藥球",
    unit: "m",
    attemptCount: 3,
    higherIsBetter: true,
    decimalPlaces: 2,
  },
] as const;

export const FITNESS_TEST_ITEM_BY_KEY = Object.fromEntries(
  FITNESS_TEST_ITEMS.map((item) => [item.key, item]),
) as Record<FitnessTestItemKey, (typeof FITNESS_TEST_ITEMS)[number]>;

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

/** 是否至少有一項有紀錄。 */
export function hasAnyFitnessStats(stats: FitnessTestStats): boolean {
  return FITNESS_TEST_ITEMS.some((item) => stats[item.key].best != null);
}

/** 列表摘要（註解：手機 roster 列 preview）。 */
export function fitnessOverallSummary(stats: FitnessTestStats): string {
  const parts = FITNESS_TEST_ITEMS.filter((item) => stats[item.key].best != null).map((item) => {
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
