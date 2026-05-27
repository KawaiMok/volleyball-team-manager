import { z } from "zod";

/** 非負整數欄位（註解：個人數據計數）。 */
const nonNegInt = z.coerce.number().int().min(0).max(9999);

/** 攻擊：次數、得分、失誤。 */
export const attackStatsSchema = z.object({
  attempts: nonNegInt.default(0),
  points: nonNegInt.default(0),
  errors: nonNegInt.default(0),
});

/** 攔網：次數、有效、失誤、得分。 */
export const blockStatsSchema = z.object({
  attempts: nonNegInt.default(0),
  effective: nonNegInt.default(0),
  errors: nonNegInt.default(0),
  points: nonNegInt.default(0),
});

/** 防守：次數、成功、失誤。 */
export const defenseStatsSchema = z.object({
  attempts: nonNegInt.default(0),
  success: nonNegInt.default(0),
  errors: nonNegInt.default(0),
});

/** 一傳：A/B/C、被 ACE。 */
export const passStatsSchema = z.object({
  perfect: nonNegInt.default(0),
  good: nonNegInt.default(0),
  poor: nonNegInt.default(0),
  aced: nonNegInt.default(0),
});

/** 發球：A/B/C、失誤、ACE。 */
export const serveStatsSchema = z.object({
  strong: nonNegInt.default(0),
  normal: nonNegInt.default(0),
  weak: nonNegInt.default(0),
  errors: nonNegInt.default(0),
  aces: nonNegInt.default(0),
});

/** 其他失誤（Double、net touch、轉位等）。 */
export const otherStatsSchema = z.object({
  errors: nonNegInt.default(0),
});

/** 個人六大類細項（註解：僅存原始計數）。 */
export const playerMatchStatsSchema = z.object({
  attack: attackStatsSchema.optional(),
  block: blockStatsSchema.optional(),
  defense: defenseStatsSchema.optional(),
  pass: passStatsSchema.optional(),
  serve: serveStatsSchema.optional(),
  other: otherStatsSchema.optional(),
});

/** 表單輸入用：各分類預設全 0。 */
export const playerMatchStatsInputSchema = z.object({
  attack: attackStatsSchema.default({ attempts: 0, points: 0, errors: 0 }),
  block: blockStatsSchema.default({ attempts: 0, effective: 0, errors: 0, points: 0 }),
  defense: defenseStatsSchema.default({ attempts: 0, success: 0, errors: 0 }),
  pass: passStatsSchema.default({ perfect: 0, good: 0, poor: 0, aced: 0 }),
  serve: serveStatsSchema.default({ strong: 0, normal: 0, weak: 0, errors: 0, aces: 0 }),
  other: otherStatsSchema.default({ errors: 0 }),
});

/** 單局比分 */
export const matchSetScoreSchema = z.object({
  our: z.number().int().min(0).max(999),
  opponent: z.number().int().min(0).max(999),
});

/** 球隊整體數據（註解：皆選填）。 */
export const matchTeamStatsSchema = z.object({
  points: z.number().int().min(0).max(9999).optional(),
  opponentPoints: z.number().int().min(0).max(9999).optional(),
  kills: z.number().int().min(0).max(9999).optional(),
  errors: z.number().int().min(0).max(9999).optional(),
  aces: z.number().int().min(0).max(9999).optional(),
  blocks: z.number().int().min(0).max(9999).optional(),
  digs: z.number().int().min(0).max(9999).optional(),
});

/** 個人數據列。 */
export const matchPlayerStatSchema = z.object({
  memberId: z.string().min(1),
  stats: playerMatchStatsInputSchema,
});

export const matchResultBodySchema = z.object({
  opponentName: z.string().max(120).optional().nullable(),
  sets: z.array(matchSetScoreSchema).min(1).max(5),
  teamStats: matchTeamStatsSchema.optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  playerStats: z.array(matchPlayerStatSchema),
});

export type MatchSetScore = z.infer<typeof matchSetScoreSchema>;
export type MatchTeamStats = z.infer<typeof matchTeamStatsSchema>;
export type AttackStats = z.infer<typeof attackStatsSchema>;
export type BlockStats = z.infer<typeof blockStatsSchema>;
export type DefenseStats = z.infer<typeof defenseStatsSchema>;
export type PassStats = z.infer<typeof passStatsSchema>;
export type ServeStats = z.infer<typeof serveStatsSchema>;
export type OtherStats = z.infer<typeof otherStatsSchema>;
export type PlayerMatchStats = z.infer<typeof playerMatchStatsInputSchema>;
export type MatchPlayerStatInput = z.infer<typeof matchPlayerStatSchema>;

/** 教練表單／列表用球員列。 */
export type MatchResultPlayerRow = {
  memberId: string;
  displayName: string;
  stats: PlayerMatchStats;
};

/** 六大分類 tab 鍵值。 */
export const STAT_CATEGORIES = ["attack", "block", "defense", "pass", "serve", "other"] as const;
export type StatCategory = (typeof STAT_CATEGORIES)[number];

export const STAT_CATEGORY_LABELS: Record<StatCategory, string> = {
  attack: "攻擊",
  block: "攔網",
  defense: "防守",
  pass: "一傳",
  serve: "發球",
  other: "其他",
};

export const MATCH_TEAM_STAT_LABELS: Record<keyof MatchTeamStats, string> = {
  points: "得分",
  opponentPoints: "對手得分",
  kills: "擊球得分",
  errors: "失誤",
  aces: "發球 Ace",
  blocks: "攔網得分",
  digs: "防守成功",
};

/** 空白個人 stats 模板。 */
export const EMPTY_PLAYER_STATS: PlayerMatchStats = {
  attack: { attempts: 0, points: 0, errors: 0 },
  block: { attempts: 0, effective: 0, errors: 0, points: 0 },
  defense: { attempts: 0, success: 0, errors: 0 },
  pass: { perfect: 0, good: 0, poor: 0, aced: 0 },
  serve: { strong: 0, normal: 0, weak: 0, errors: 0, aces: 0 },
  other: { errors: 0 },
};

/** 正規化 DB/API 回傳的 stats JSON。 */
export function normalizePlayerStats(raw: unknown): PlayerMatchStats {
  const parsed = playerMatchStatsInputSchema.safeParse(raw ?? {});
  return parsed.success ? parsed.data : { ...EMPTY_PLAYER_STATS };
}

/** 精簡儲存：移除全 0 分類，僅保留有值的欄位。 */
export function compactPlayerStats(stats: PlayerMatchStats): PlayerMatchStats {
  const out: Partial<PlayerMatchStats> = {};
  if (hasCategoryData(stats, "attack")) out.attack = stats.attack;
  if (hasCategoryData(stats, "block")) out.block = stats.block;
  if (hasCategoryData(stats, "defense")) out.defense = stats.defense;
  if (hasCategoryData(stats, "pass")) out.pass = stats.pass;
  if (hasCategoryData(stats, "serve")) out.serve = stats.serve;
  if (hasCategoryData(stats, "other")) out.other = stats.other;
  return out as PlayerMatchStats;
}

/** 某分類是否有任一非零計數。 */
export function hasCategoryData(stats: PlayerMatchStats, category: StatCategory): boolean {
  const cat = stats[category];
  if (!cat) return false;
  return Object.values(cat).some((v) => typeof v === "number" && v > 0);
}

/** 個人是否有任一非零數據。 */
export function hasAnyPlayerStats(stats: PlayerMatchStats): boolean {
  return STAT_CATEGORIES.some((c) => hasCategoryData(stats, c));
}

/** 從各局比分計算局數勝負 */
export function computeSetWins(sets: MatchSetScore[]) {
  let our = 0;
  let opponent = 0;
  for (const s of sets) {
    if (s.our > s.opponent) our += 1;
    else if (s.opponent > s.our) opponent += 1;
  }
  return { our, opponent };
}
