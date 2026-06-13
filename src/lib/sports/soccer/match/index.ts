import { z } from "zod";

import {
  computeAdjustedOverallIndicator,
  formatRating,
  mergePlayerStats,
} from "@/lib/sports/match/metrics";
import type { PeriodScore, PlayerStatsRecord, SportMatchClientModule, StatFieldDef } from "@/lib/sports/match/types";
import { SOCCER_STANDOUT_LEADERS } from "@/lib/sports/soccer/match/standout";

const nonNegInt = z.coerce.number().int().min(0).max(9999);

const attackSchema = z.object({
  shots: nonNegInt.default(0),
  shotsOnTarget: nonNegInt.default(0),
  goals: nonNegInt.default(0),
  assists: nonNegInt.default(0),
});

const passingSchema = z.object({
  passes: nonNegInt.default(0),
  keyPasses: nonNegInt.default(0),
  turnovers: nonNegInt.default(0),
});

const defenseSchema = z.object({
  tackles: nonNegInt.default(0),
  interceptions: nonNegInt.default(0),
  clearances: nonNegInt.default(0),
});

const goalkeepingSchema = z.object({
  saves: nonNegInt.default(0),
  goalsConceded: nonNegInt.default(0),
});

const disciplineSchema = z.object({
  yellowCards: nonNegInt.default(0),
  redCards: nonNegInt.default(0),
});

const otherSchema = z.object({
  fouls: nonNegInt.default(0),
});

const playerStatsSchema = z.object({
  attack: attackSchema.default({ shots: 0, shotsOnTarget: 0, goals: 0, assists: 0 }),
  passing: passingSchema.default({ passes: 0, keyPasses: 0, turnovers: 0 }),
  defense: defenseSchema.default({ tackles: 0, interceptions: 0, clearances: 0 }),
  goalkeeping: goalkeepingSchema.default({ saves: 0, goalsConceded: 0 }),
  discipline: disciplineSchema.default({ yellowCards: 0, redCards: 0 }),
  other: otherSchema.default({ fouls: 0 }),
});

const periodScoreSchema = z.object({
  our: z.number().int().min(0).max(99),
  opponent: z.number().int().min(0).max(99),
});

const teamStatsSchema = z.object({
  shots: z.number().int().min(0).max(999).optional(),
  shotsOnTarget: z.number().int().min(0).max(999).optional(),
  corners: z.number().int().min(0).max(999).optional(),
  fouls: z.number().int().min(0).max(999).optional(),
});

const matchResultBodySchema = z.object({
  opponentName: z.string().max(120).optional().nullable(),
  sets: z.array(periodScoreSchema).length(2),
  teamStats: teamStatsSchema.optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  playerStats: z.array(z.object({ memberId: z.string().min(1), stats: playerStatsSchema })),
});

export const SOCCER_CATEGORIES = [
  "attack",
  "passing",
  "defense",
  "goalkeeping",
  "discipline",
  "other",
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  attack: "進攻",
  passing: "傳控",
  defense: "防守",
  goalkeeping: "門將",
  discipline: "紀律",
  other: "其他",
};

const CATEGORY_FIELDS: Record<string, StatFieldDef[]> = {
  attack: [
    { key: "shots", label: "射門" },
    { key: "shotsOnTarget", label: "射正" },
    { key: "goals", label: "進球" },
    { key: "assists", label: "助攻" },
    { key: "_rating", label: "進攻 rating", derived: "attackRating" },
  ],
  passing: [
    { key: "passes", label: "傳球" },
    { key: "keyPasses", label: "關鍵傳球" },
    { key: "turnovers", label: "失誤" },
    { key: "_rating", label: "傳控 rating", derived: "passingRating" },
  ],
  defense: [
    { key: "tackles", label: "搶斷" },
    { key: "interceptions", label: "攔截" },
    { key: "clearances", label: "解圍" },
    { key: "_rating", label: "防守 rating", derived: "defenseRating" },
  ],
  goalkeeping: [
    { key: "saves", label: "撲救" },
    { key: "goalsConceded", label: "失球" },
    { key: "_rating", label: "門將 rating", derived: "goalkeepingRating" },
  ],
  discipline: [
    { key: "yellowCards", label: "黃牌" },
    { key: "redCards", label: "紅牌" },
  ],
  other: [{ key: "fouls", label: "犯規" }],
};

const TEAM_STAT_LABELS: Record<string, string> = {
  shots: "射門",
  shotsOnTarget: "射正",
  corners: "角球",
  fouls: "犯規",
};

function emptyPlayerStats(): PlayerStatsRecord {
  return playerStatsSchema.parse({});
}

function hasCategoryData(stats: PlayerStatsRecord, category: string): boolean {
  const cat = stats[category];
  if (!cat) return false;
  return Object.values(cat).some((v) => typeof v === "number" && v > 0);
}

function computeAttackRating(stats: PlayerStatsRecord): number | null {
  const a = stats.attack;
  if (!a || (a.shots ?? 0) <= 0) return null;
  return ((a.goals ?? 0) * 4 + (a.assists ?? 0) * 3 + (a.shotsOnTarget ?? 0)) / a.shots;
}

function computePassingRating(stats: PlayerStatsRecord): number | null {
  const p = stats.passing;
  if (!p) return null;
  const denom = (p.passes ?? 0) + (p.keyPasses ?? 0);
  if (denom <= 0) return null;
  return ((p.keyPasses ?? 0) * 3 + (p.passes ?? 0) * 0.2 - (p.turnovers ?? 0) * 2) / denom;
}

function computeDefenseRating(stats: PlayerStatsRecord): number | null {
  const d = stats.defense;
  if (!d) return null;
  const denom = (d.tackles ?? 0) + (d.interceptions ?? 0) + (d.clearances ?? 0);
  if (denom <= 0) return null;
  return ((d.tackles ?? 0) * 2 + (d.interceptions ?? 0) * 2 + (d.clearances ?? 0)) / denom;
}

function computeGoalkeepingRating(stats: PlayerStatsRecord): number | null {
  const g = stats.goalkeeping;
  if (!g) return null;
  const denom = (g.saves ?? 0) + (g.goalsConceded ?? 0);
  if (denom <= 0) return null;
  return (g.saves ?? 0) / denom;
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
      case "attackRating":
        return computeAttackRating(stats);
      case "passingRating":
        return computePassingRating(stats);
      case "defenseRating":
        return computeDefenseRating(stats);
      case "goalkeepingRating":
        return computeGoalkeepingRating(stats);
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
      case "attackRating":
        return stats.attack?.shots ?? 0;
      case "passingRating": {
        const p = stats.passing;
        if (!p) return 0;
        return (p.passes ?? 0) + (p.keyPasses ?? 0);
      }
      case "defenseRating": {
        const d = stats.defense;
        if (!d) return 0;
        return (d.tackles ?? 0) + (d.interceptions ?? 0) + (d.clearances ?? 0);
      }
      case "goalkeepingRating": {
        const g = stats.goalkeeping;
        if (!g) return 0;
        return (g.saves ?? 0) + (g.goalsConceded ?? 0);
      }
      default:
        return 0;
    }
  }
  return getFieldNumericValue(stats, category, fieldKey) ?? 0;
}

function derivedStatValue(stats: PlayerStatsRecord, derived: string): string {
  switch (derived) {
    case "attackRating":
      return formatRating(computeAttackRating(stats));
    case "passingRating":
      return formatRating(computePassingRating(stats));
    case "defenseRating":
      return formatRating(computeDefenseRating(stats));
    case "goalkeepingRating":
      return formatRating(computeGoalkeepingRating(stats));
    default:
      return "—";
  }
}

/** 足球比賽統計外掛（上下半場 + 全場合計） */
export const soccerMatchModule: SportMatchClientModule = {
  score: {
    kind: "halves",
    fixedPeriodCount: 2,
    minPeriods: 2,
    maxPeriods: 2,
    canAddPeriod: false,
    summaryMode: "totalPoints",
    periodLabel: (i) => (i === 0 ? "上半場" : "下半場"),
    periodsSectionTitle: "上下半場比分",
  },
  categories: SOCCER_CATEGORIES,
  categoryLabels: CATEGORY_LABELS,
  categoryFields: CATEGORY_FIELDS,
  teamStatKeys: Object.keys(TEAM_STAT_LABELS),
  teamStatLabels: TEAM_STAT_LABELS,
  ratings: [
    {
      key: "attackRating",
      label: "進攻",
      compute: computeAttackRating,
      normMin: 0,
      normMax: 4,
      sampleSize: (s) => s.attack?.shots ?? 0,
    },
    {
      key: "passingRating",
      label: "傳控",
      compute: computePassingRating,
      normMin: -2,
      normMax: 3,
      sampleSize: (s) => {
        const p = s.passing;
        if (!p) return 0;
        return (p.passes ?? 0) + (p.keyPasses ?? 0);
      },
    },
    {
      key: "defenseRating",
      label: "防守",
      compute: computeDefenseRating,
      normMin: 0,
      normMax: 3,
      sampleSize: (s) => {
        const d = s.defense;
        if (!d) return 0;
        return (d.tackles ?? 0) + (d.interceptions ?? 0) + (d.clearances ?? 0);
      },
    },
    {
      key: "goalkeepingRating",
      label: "門將",
      compute: computeGoalkeepingRating,
      normMin: 0,
      normMax: 1,
      sampleSize: (s) => {
        const g = s.goalkeeping;
        if (!g) return 0;
        return (g.saves ?? 0) + (g.goalsConceded ?? 0);
      },
    },
  ],
  standoutLeaders: SOCCER_STANDOUT_LEADERS,
  matchResultBodySchema,

  emptyPlayerStats,
  normalizePlayerStats: (raw) => {
    const parsed = playerStatsSchema.safeParse(raw ?? {});
    return parsed.success ? parsed.data : emptyPlayerStats();
  },
  compactPlayerStats: (stats) => {
    const out: PlayerStatsRecord = {};
    for (const c of SOCCER_CATEGORIES) {
      if (hasCategoryData(stats, c)) out[c] = stats[c];
    }
    return out;
  },
  hasCategoryData,
  hasAnyPlayerStats: (stats) => SOCCER_CATEGORIES.some((c) => hasCategoryData(stats, c)),
  derivedStatValue,
  getFieldNumericValue,
  getFieldSampleSize,
  playerOverallSummary: (stats) => {
    const filled = SOCCER_CATEGORIES.filter((c) => hasCategoryData(stats, c));
    if (filled.length === 0) return "尚未填寫";
    return filled.map((c) => CATEGORY_LABELS[c]).join("、");
  },
  computeOverallIndicator: (stats) => computeAdjustedOverallIndicator(soccerMatchModule, stats),
  addPlayerStats: (a, b) =>
    mergePlayerStats(SOCCER_CATEGORIES, CATEGORY_FIELDS, a, b) as PlayerStatsRecord,
  computeScoreSummary: (periods, _teamName, _opponentName) => {
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
