import { z } from "zod";

import {
  computeAdjustedOverallIndicator,
  formatPct,
  formatRating,
  mergePlayerStats,
} from "@/lib/sports/match/metrics";
import type { PeriodScore, PlayerStatsRecord, SportMatchClientModule, StatFieldDef } from "@/lib/sports/match/types";
import { BASKETBALL_STANDOUT_LEADERS } from "@/lib/sports/basketball/match/standout";

const nonNegInt = z.coerce.number().int().min(0).max(9999);

const scoringSchema = z.object({
  points: nonNegInt.default(0),
  fgMade: nonNegInt.default(0),
  fgAttempted: nonNegInt.default(0),
  threeMade: nonNegInt.default(0),
  threeAttempted: nonNegInt.default(0),
  ftMade: nonNegInt.default(0),
  ftAttempted: nonNegInt.default(0),
});

const reboundingSchema = z.object({
  offensiveReb: nonNegInt.default(0),
  defensiveReb: nonNegInt.default(0),
});

const playmakingSchema = z.object({
  assists: nonNegInt.default(0),
  turnovers: nonNegInt.default(0),
});

const defenseSchema = z.object({
  steals: nonNegInt.default(0),
  blocks: nonNegInt.default(0),
});

const foulsSchema = z.object({
  personalFouls: nonNegInt.default(0),
});

const playerStatsSchema = z.object({
  scoring: scoringSchema.default({
    points: 0,
    fgMade: 0,
    fgAttempted: 0,
    threeMade: 0,
    threeAttempted: 0,
    ftMade: 0,
    ftAttempted: 0,
  }),
  rebounding: reboundingSchema.default({ offensiveReb: 0, defensiveReb: 0 }),
  playmaking: playmakingSchema.default({ assists: 0, turnovers: 0 }),
  defense: defenseSchema.default({ steals: 0, blocks: 0 }),
  fouls: foulsSchema.default({ personalFouls: 0 }),
});

const periodScoreSchema = z.object({
  our: z.number().int().min(0).max(999),
  opponent: z.number().int().min(0).max(999),
});

const teamStatsSchema = z.object({
  points: z.number().int().min(0).max(9999).optional(),
  opponentPoints: z.number().int().min(0).max(9999).optional(),
  fgMade: z.number().int().min(0).max(9999).optional(),
  fgAttempted: z.number().int().min(0).max(9999).optional(),
  threeMade: z.number().int().min(0).max(9999).optional(),
  threeAttempted: z.number().int().min(0).max(9999).optional(),
  rebounds: z.number().int().min(0).max(9999).optional(),
  assists: z.number().int().min(0).max(9999).optional(),
  turnovers: z.number().int().min(0).max(9999).optional(),
});

const matchResultBodySchema = z.object({
  opponentName: z.string().max(120).optional().nullable(),
  sets: z.array(periodScoreSchema).length(4),
  teamStats: teamStatsSchema.optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  playerStats: z.array(z.object({ memberId: z.string().min(1), stats: playerStatsSchema })),
});

export const BASKETBALL_CATEGORIES = [
  "scoring",
  "rebounding",
  "playmaking",
  "defense",
  "fouls",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  scoring: "得分",
  rebounding: "籃板",
  playmaking: "組織",
  defense: "防守",
  fouls: "犯規",
};

const CATEGORY_FIELDS: Record<string, StatFieldDef[]> = {
  scoring: [
    { key: "points", label: "得分" },
    { key: "fgMade", label: "兩分/投進" },
    { key: "fgAttempted", label: "兩分/出手" },
    { key: "threeMade", label: "三分命中" },
    { key: "threeAttempted", label: "三分出手" },
    { key: "ftMade", label: "罰球命中" },
    { key: "ftAttempted", label: "罰球出手" },
    { key: "_ts", label: "真實命中率%", derived: "trueShooting" },
  ],
  rebounding: [
    { key: "offensiveReb", label: "進攻籃板" },
    { key: "defensiveReb", label: "防守籃板" },
    { key: "_rating", label: "籃板 rating", derived: "reboundRating" },
  ],
  playmaking: [
    { key: "assists", label: "助攻" },
    { key: "turnovers", label: "失誤" },
    { key: "_rating", label: "組織 rating", derived: "playmakingRating" },
  ],
  defense: [
    { key: "steals", label: "抄截" },
    { key: "blocks", label: "火鍋" },
    { key: "_rating", label: "防守 rating", derived: "defenseRating" },
  ],
  fouls: [{ key: "personalFouls", label: "個人犯規" }],
};

const TEAM_STAT_LABELS: Record<string, string> = {
  points: "得分",
  opponentPoints: "對手得分",
  fgMade: "投籃命中",
  fgAttempted: "投籃出手",
  threeMade: "三分命中",
  threeAttempted: "三分出手",
  rebounds: "籃板",
  assists: "助攻",
  turnovers: "失誤",
};

function emptyPlayerStats(): PlayerStatsRecord {
  return playerStatsSchema.parse({});
}

function hasCategoryData(stats: PlayerStatsRecord, category: string): boolean {
  const cat = stats[category];
  if (!cat) return false;
  return Object.values(cat).some((v) => typeof v === "number" && v > 0);
}

function computeTrueShooting(stats: PlayerStatsRecord): number | null {
  const s = stats.scoring;
  if (!s) return null;
  const fga = (s.fgAttempted ?? 0) + (s.threeAttempted ?? 0);
  const fta = s.ftAttempted ?? 0;
  const pts = s.points ?? 0;
  const denom = 2 * (fga + 0.44 * fta);
  if (denom <= 0) return null;
  return pts / denom;
}

function computeReboundRating(stats: PlayerStatsRecord): number | null {
  const r = stats.rebounding;
  if (!r) return null;
  const denom = (r.offensiveReb ?? 0) + (r.defensiveReb ?? 0);
  if (denom <= 0) return null;
  return ((r.offensiveReb ?? 0) * 1.2 + (r.defensiveReb ?? 0)) / denom;
}

function computePlaymakingRating(stats: PlayerStatsRecord): number | null {
  const p = stats.playmaking;
  if (!p) return null;
  const denom = (p.assists ?? 0) + (p.turnovers ?? 0);
  if (denom <= 0) return null;
  return ((p.assists ?? 0) * 3 - (p.turnovers ?? 0)) / denom;
}

function computeDefenseRating(stats: PlayerStatsRecord): number | null {
  const d = stats.defense;
  if (!d) return null;
  const denom = (d.steals ?? 0) + (d.blocks ?? 0);
  if (denom <= 0) return null;
  return ((d.steals ?? 0) * 2 + (d.blocks ?? 0) * 2) / denom;
}

function scoringShotAttempts(stats: PlayerStatsRecord): number {
  const s = stats.scoring;
  if (!s) return 0;
  return (s.fgAttempted ?? 0) + (s.threeAttempted ?? 0) + (s.ftAttempted ?? 0);
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
      case "trueShooting":
        return computeTrueShooting(stats);
      case "reboundRating":
        return computeReboundRating(stats);
      case "playmakingRating":
        return computePlaymakingRating(stats);
      case "defenseRating":
        return computeDefenseRating(stats);
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
      case "trueShooting":
        return scoringShotAttempts(stats);
      case "reboundRating": {
        const r = stats.rebounding;
        if (!r) return 0;
        return (r.offensiveReb ?? 0) + (r.defensiveReb ?? 0);
      }
      case "playmakingRating": {
        const p = stats.playmaking;
        if (!p) return 0;
        return (p.assists ?? 0) + (p.turnovers ?? 0);
      }
      case "defenseRating": {
        const d = stats.defense;
        if (!d) return 0;
        return (d.steals ?? 0) + (d.blocks ?? 0);
      }
      default:
        return 0;
    }
  }
  return getFieldNumericValue(stats, category, fieldKey) ?? 0;
}

function derivedStatValue(stats: PlayerStatsRecord, derived: string): string {
  switch (derived) {
    case "trueShooting":
      return formatPct(computeTrueShooting(stats));
    case "reboundRating":
      return formatRating(computeReboundRating(stats));
    case "playmakingRating":
      return formatRating(computePlaymakingRating(stats));
    case "defenseRating":
      return formatRating(computeDefenseRating(stats));
    default:
      return "—";
  }
}

/** 籃球比賽統計外掛（四節 + 全場合計） */
export const basketballMatchModule: SportMatchClientModule = {
  score: {
    kind: "quarters",
    fixedPeriodCount: 4,
    minPeriods: 4,
    maxPeriods: 4,
    canAddPeriod: false,
    summaryMode: "totalPoints",
    periodLabel: (i) => `第 ${i + 1} 節`,
    periodsSectionTitle: "各節比分",
  },
  categories: BASKETBALL_CATEGORIES,
  categoryLabels: CATEGORY_LABELS,
  categoryFields: CATEGORY_FIELDS,
  teamStatKeys: Object.keys(TEAM_STAT_LABELS),
  teamStatLabels: TEAM_STAT_LABELS,
  ratings: [
    {
      key: "trueShooting",
      label: "得分效率",
      compute: computeTrueShooting,
      normMin: 0,
      normMax: 0.7,
      sampleSize: scoringShotAttempts,
    },
    {
      key: "reboundRating",
      label: "籃板",
      compute: computeReboundRating,
      normMin: 0,
      normMax: 2,
      sampleSize: (s) => {
        const r = s.rebounding;
        if (!r) return 0;
        return (r.offensiveReb ?? 0) + (r.defensiveReb ?? 0);
      },
    },
    {
      key: "playmakingRating",
      label: "組織",
      compute: computePlaymakingRating,
      normMin: -1,
      normMax: 3,
      sampleSize: (s) => {
        const p = s.playmaking;
        if (!p) return 0;
        return (p.assists ?? 0) + (p.turnovers ?? 0);
      },
    },
    {
      key: "defenseRating",
      label: "防守",
      compute: computeDefenseRating,
      normMin: 0,
      normMax: 4,
      sampleSize: (s) => {
        const d = s.defense;
        if (!d) return 0;
        return (d.steals ?? 0) + (d.blocks ?? 0);
      },
    },
  ],
  standoutLeaders: BASKETBALL_STANDOUT_LEADERS,
  matchResultBodySchema,

  emptyPlayerStats,
  normalizePlayerStats: (raw) => {
    const parsed = playerStatsSchema.safeParse(raw ?? {});
    return parsed.success ? parsed.data : emptyPlayerStats();
  },
  compactPlayerStats: (stats) => {
    const out: PlayerStatsRecord = {};
    for (const c of BASKETBALL_CATEGORIES) {
      if (hasCategoryData(stats, c)) out[c] = stats[c];
    }
    return out;
  },
  hasCategoryData,
  hasAnyPlayerStats: (stats) => BASKETBALL_CATEGORIES.some((c) => hasCategoryData(stats, c)),
  derivedStatValue,
  getFieldNumericValue,
  getFieldSampleSize,
  playerOverallSummary: (stats) => {
    const filled = BASKETBALL_CATEGORIES.filter((c) => hasCategoryData(stats, c));
    if (filled.length === 0) return "尚未填寫";
    return filled.map((c) => CATEGORY_LABELS[c]).join("、");
  },
  computeOverallIndicator: (stats) => computeAdjustedOverallIndicator(basketballMatchModule, stats),
  addPlayerStats: (a, b) =>
    mergePlayerStats(BASKETBALL_CATEGORIES, CATEGORY_FIELDS, a, b) as PlayerStatsRecord,
  computeScoreSummary: (periods) => {
    const total = periods.reduce(
      (acc, p) => ({ our: acc.our + p.our, opponent: acc.opponent + p.opponent }),
      { our: 0, opponent: 0 },
    );
    return {
      ourValue: total.our,
      opponentValue: total.opponent,
      won: total.our > total.opponent ? true : total.our < total.opponent ? false : null,
      headline: "全場比分",
    };
  },
  sumPeriodScores: (periods) =>
    periods.reduce(
      (acc, p) => ({ our: acc.our + p.our, opponent: acc.opponent + p.opponent }),
      { our: 0, opponent: 0 },
    ),
};
