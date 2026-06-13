import { z } from "zod";

import {
  computeAdjustedOverallIndicator,
  formatPct,
  formatRating,
  mergePlayerStats,
} from "@/lib/sports/match/metrics";
import type {
  PeriodScore,
  PlayerStatsRecord,
  SportMatchClientModule,
  StatFieldDef,
} from "@/lib/sports/match/types";
import { VOLLEYBALL_STANDOUT_LEADERS } from "@/lib/sports/volleyball/match/standout";

const nonNegInt = z.coerce.number().int().min(0).max(9999);

const attackStatsSchema = z.object({
  attempts: nonNegInt.default(0),
  points: nonNegInt.default(0),
  errors: nonNegInt.default(0),
});

const blockStatsSchema = z.object({
  attempts: nonNegInt.default(0),
  effective: nonNegInt.default(0),
  errors: nonNegInt.default(0),
  points: nonNegInt.default(0),
});

const defenseStatsSchema = z.object({
  attempts: nonNegInt.default(0),
  success: nonNegInt.default(0),
  errors: nonNegInt.default(0),
});

const passStatsSchema = z.object({
  perfect: nonNegInt.default(0),
  good: nonNegInt.default(0),
  poor: nonNegInt.default(0),
  aced: nonNegInt.default(0),
});

const serveStatsSchema = z.object({
  strong: nonNegInt.default(0),
  normal: nonNegInt.default(0),
  weak: nonNegInt.default(0),
  errors: nonNegInt.default(0),
  aces: nonNegInt.default(0),
});

const otherStatsSchema = z.object({
  errors: nonNegInt.default(0),
});

const playerMatchStatsInputSchema = z.object({
  attack: attackStatsSchema.default({ attempts: 0, points: 0, errors: 0 }),
  block: blockStatsSchema.default({ attempts: 0, effective: 0, errors: 0, points: 0 }),
  defense: defenseStatsSchema.default({ attempts: 0, success: 0, errors: 0 }),
  pass: passStatsSchema.default({ perfect: 0, good: 0, poor: 0, aced: 0 }),
  serve: serveStatsSchema.default({ strong: 0, normal: 0, weak: 0, errors: 0, aces: 0 }),
  other: otherStatsSchema.default({ errors: 0 }),
});

const periodScoreSchema = z.object({
  our: z.number().int().min(0).max(999),
  opponent: z.number().int().min(0).max(999),
});

const teamStatsSchema = z.object({
  points: z.number().int().min(0).max(9999).optional(),
  opponentPoints: z.number().int().min(0).max(9999).optional(),
  kills: z.number().int().min(0).max(9999).optional(),
  errors: z.number().int().min(0).max(9999).optional(),
  aces: z.number().int().min(0).max(9999).optional(),
  blocks: z.number().int().min(0).max(9999).optional(),
  digs: z.number().int().min(0).max(9999).optional(),
});

const matchResultBodySchema = z.object({
  opponentName: z.string().max(120).optional().nullable(),
  sets: z.array(periodScoreSchema).min(1).max(5),
  teamStats: teamStatsSchema.optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  playerStats: z.array(
    z.object({
      memberId: z.string().min(1),
      stats: playerMatchStatsInputSchema,
    }),
  ),
});

export const VOLLEYBALL_CATEGORIES = [
  "attack",
  "block",
  "defense",
  "pass",
  "serve",
  "other",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  attack: "攻擊",
  block: "攔網",
  defense: "防守",
  pass: "一傳",
  serve: "發球",
  other: "其他",
};

const CATEGORY_FIELDS: Record<string, StatFieldDef[]> = {
  attack: [
    { key: "attempts", label: "次數" },
    { key: "points", label: "得分" },
    { key: "errors", label: "失誤" },
    { key: "_scoreRate", label: "得分率%", derived: "attackScore" },
    { key: "_errorRate", label: "失誤率%", derived: "attackError" },
  ],
  block: [
    { key: "attempts", label: "次數" },
    { key: "effective", label: "有效" },
    { key: "errors", label: "失誤" },
    { key: "points", label: "得分" },
    { key: "_rating", label: "攔網 rating", derived: "blockRating" },
  ],
  defense: [
    { key: "attempts", label: "次數" },
    { key: "success", label: "成功" },
    { key: "errors", label: "失誤" },
    { key: "_rate", label: "有效防守%", derived: "defenseRate" },
  ],
  pass: [
    { key: "perfect", label: "A 完美" },
    { key: "good", label: "B 僅入3米" },
    { key: "poor", label: "C 修正或更差" },
    { key: "aced", label: "被 ACE" },
    { key: "_rating", label: "一傳 rating", derived: "passRating" },
  ],
  serve: [
    { key: "strong", label: "A 強" },
    { key: "normal", label: "B 一般" },
    { key: "weak", label: "C 菜" },
    { key: "errors", label: "失誤" },
    { key: "aces", label: "ACE" },
    { key: "_rating", label: "發球 rating", derived: "serveRating" },
  ],
  other: [{ key: "errors", label: "失誤" }],
};

const TEAM_STAT_LABELS: Record<string, string> = {
  points: "得分",
  opponentPoints: "對手得分",
  kills: "擊球得分",
  errors: "失誤",
  aces: "發球 Ace",
  blocks: "攔網得分",
  digs: "防守成功",
};

function emptyPlayerStats(): PlayerStatsRecord {
  return playerMatchStatsInputSchema.parse({});
}

function hasCategoryData(stats: PlayerStatsRecord, category: string): boolean {
  const cat = stats[category];
  if (!cat) return false;
  return Object.values(cat).some((v) => typeof v === "number" && v > 0);
}

function computeAttackRating(stats: PlayerStatsRecord): number | null {
  const a = stats.attack;
  if (!a || (a.attempts ?? 0) <= 0) return null;
  return ((a.points ?? 0) - (a.errors ?? 0)) / a.attempts;
}

function computeBlockRating(stats: PlayerStatsRecord): number | null {
  const b = stats.block;
  if (!b || (b.attempts ?? 0) <= 0) return null;
  return ((b.points ?? 0) * 2 + (b.effective ?? 0)) / b.attempts;
}

function computeDefenseRating(stats: PlayerStatsRecord): number | null {
  const d = stats.defense;
  if (!d || (d.attempts ?? 0) <= 0) return null;
  return ((d.success ?? 0) - (d.errors ?? 0)) / d.attempts;
}

function computePassRating(stats: PlayerStatsRecord): number | null {
  const p = stats.pass;
  if (!p) return null;
  const total = (p.perfect ?? 0) + (p.good ?? 0) + (p.poor ?? 0) + (p.aced ?? 0);
  if (total <= 0) return null;
  return (
    (p.perfect ?? 0) * 3 + (p.good ?? 0) * 2 + (p.poor ?? 0) + (p.aced ?? 0) * -1
  ) / total;
}

function computeServeRating(stats: PlayerStatsRecord): number | null {
  const s = stats.serve;
  if (!s) return null;
  const total = (s.strong ?? 0) + (s.normal ?? 0) + (s.weak ?? 0) + (s.errors ?? 0) + (s.aces ?? 0);
  if (total <= 0) return null;
  return (
    (s.aces ?? 0) * 4 +
    (s.strong ?? 0) * 3 +
    (s.normal ?? 0) * 2 +
    (s.weak ?? 0) +
    (s.errors ?? 0) * -1
  ) / total;
}

function passSampleSize(stats: PlayerStatsRecord): number {
  const p = stats.pass;
  if (!p) return 0;
  return (p.perfect ?? 0) + (p.good ?? 0) + (p.poor ?? 0) + (p.aced ?? 0);
}

function serveSampleSize(stats: PlayerStatsRecord): number {
  const s = stats.serve;
  if (!s) return 0;
  return (s.strong ?? 0) + (s.normal ?? 0) + (s.weak ?? 0) + (s.errors ?? 0) + (s.aces ?? 0);
}

function getFieldNumericValue(
  stats: PlayerStatsRecord,
  category: string,
  fieldKey: string,
): number | null {
  const field = CATEGORY_FIELDS[category]?.find((f) => f.key === fieldKey);
  if (!field) return null;
  if (field.derived) {
    switch (field.derived) {
      case "attackScore": {
        const a = stats.attack;
        if (!a || (a.attempts ?? 0) <= 0) return null;
        return (a.points ?? 0) / a.attempts;
      }
      case "attackError": {
        const a = stats.attack;
        if (!a || (a.attempts ?? 0) <= 0) return null;
        return (a.errors ?? 0) / a.attempts;
      }
      case "blockRating":
        return computeBlockRating(stats);
      case "defenseRate": {
        const d = stats.defense;
        if (!d || (d.attempts ?? 0) <= 0) return null;
        return (d.success ?? 0) / d.attempts;
      }
      case "passRating":
        return computePassRating(stats);
      case "serveRating":
        return computeServeRating(stats);
      default:
        return null;
    }
  }
  const cat = stats[category] as Record<string, number> | undefined;
  const v = cat?.[fieldKey];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function getFieldSampleSize(stats: PlayerStatsRecord, category: string, fieldKey: string): number {
  const field = CATEGORY_FIELDS[category]?.find((f) => f.key === fieldKey);
  if (!field) return 0;
  if (field.derived) {
    switch (field.derived) {
      case "attackScore":
      case "attackError":
        return stats.attack?.attempts ?? 0;
      case "blockRating":
        return stats.block?.attempts ?? 0;
      case "defenseRate":
        return stats.defense?.attempts ?? 0;
      case "passRating":
        return passSampleSize(stats);
      case "serveRating":
        return serveSampleSize(stats);
      default:
        return 0;
    }
  }
  return getFieldNumericValue(stats, category, fieldKey) ?? 0;
}

function derivedStatValue(stats: PlayerStatsRecord, derived: string): string {
  switch (derived) {
    case "attackScore": {
      const a = stats.attack;
      if (!a || (a.attempts ?? 0) <= 0) return "—";
      return formatPct((a.points ?? 0) / a.attempts);
    }
    case "attackError": {
      const a = stats.attack;
      if (!a || (a.attempts ?? 0) <= 0) return "—";
      return formatPct((a.errors ?? 0) / a.attempts);
    }
    case "blockRating":
      return formatRating(computeBlockRating(stats));
    case "defenseRate": {
      const d = stats.defense;
      if (!d || (d.attempts ?? 0) <= 0) return "—";
      return formatPct((d.success ?? 0) / d.attempts);
    }
    case "passRating":
      return formatRating(computePassRating(stats));
    case "serveRating":
      return formatRating(computeServeRating(stats));
    default:
      return "—";
  }
}

function computePeriodWins(periods: PeriodScore[]) {
  let our = 0;
  let opponent = 0;
  for (const s of periods) {
    if (s.our > s.opponent) our += 1;
    else if (s.opponent > s.our) opponent += 1;
  }
  return { our, opponent };
}

/** 排球比賽統計外掛 */
export const volleyballMatchModule: SportMatchClientModule = {
  score: {
    kind: "sets",
    minPeriods: 1,
    maxPeriods: 5,
    canAddPeriod: true,
    summaryMode: "periodWins",
    periodLabel: (i) => `第 ${i + 1} 局`,
    periodsSectionTitle: "各局比分",
  },
  categories: VOLLEYBALL_CATEGORIES,
  categoryLabels: CATEGORY_LABELS,
  categoryFields: CATEGORY_FIELDS,
  teamStatKeys: Object.keys(TEAM_STAT_LABELS),
  teamStatLabels: TEAM_STAT_LABELS,
  ratings: [
    {
      key: "attackRating",
      label: "攻擊",
      compute: computeAttackRating,
      normMin: -1,
      normMax: 1,
      sampleSize: (s) => s.attack?.attempts ?? 0,
    },
    {
      key: "defenseRating",
      label: "防守",
      compute: computeDefenseRating,
      normMin: -1,
      normMax: 1,
      sampleSize: (s) => s.defense?.attempts ?? 0,
    },
    {
      key: "blockRating",
      label: "攔網",
      compute: computeBlockRating,
      normMin: 0,
      normMax: 3,
      sampleSize: (s) => s.block?.attempts ?? 0,
    },
    {
      key: "passRating",
      label: "一傳",
      compute: computePassRating,
      normMin: -1,
      normMax: 3,
      sampleSize: passSampleSize,
    },
    {
      key: "serveRating",
      label: "發球",
      compute: computeServeRating,
      normMin: -1,
      normMax: 4,
      sampleSize: serveSampleSize,
    },
  ],
  standoutLeaders: VOLLEYBALL_STANDOUT_LEADERS,
  matchResultBodySchema,

  emptyPlayerStats,
  normalizePlayerStats: (raw) => {
    const parsed = playerMatchStatsInputSchema.safeParse(raw ?? {});
    return parsed.success ? parsed.data : emptyPlayerStats();
  },
  compactPlayerStats: (stats) => {
    const out: PlayerStatsRecord = {};
    for (const c of VOLLEYBALL_CATEGORIES) {
      if (hasCategoryData(stats, c)) out[c] = stats[c];
    }
    return out;
  },
  hasCategoryData,
  hasAnyPlayerStats: (stats) => VOLLEYBALL_CATEGORIES.some((c) => hasCategoryData(stats, c)),
  derivedStatValue,
  getFieldNumericValue,
  getFieldSampleSize,
  playerOverallSummary: (stats) => {
    const filled = VOLLEYBALL_CATEGORIES.filter((c) => hasCategoryData(stats, c));
    if (filled.length === 0) return "尚未填寫";
    return filled.map((c) => CATEGORY_LABELS[c]).join("、");
  },
  computeOverallIndicator: (stats) => computeAdjustedOverallIndicator(volleyballMatchModule, stats),
  addPlayerStats: (a, b) =>
    mergePlayerStats(VOLLEYBALL_CATEGORIES, CATEGORY_FIELDS, a, b) as PlayerStatsRecord,
  computeScoreSummary: (periods, teamName, opponentName) => {
    const { our, opponent } = computePeriodWins(periods);
    return {
      ourValue: our,
      opponentValue: opponent,
      won: our > opponent ? true : our < opponent ? false : null,
      headline: "局數",
      subline: `${teamName} ${our} : ${opponent} ${opponentName}`,
    };
  },
  sumPeriodScores: (periods) =>
    periods.reduce(
      (acc, p) => ({ our: acc.our + p.our, opponent: acc.opponent + p.opponent }),
      { our: 0, opponent: 0 },
    ),
};
