import {
  computeAttackRates,
  computeBlockRating,
  computeDefenseRate,
  computePassRating,
  computeServeRating,
  formatPct,
  formatRating,
} from "@/lib/match-player-stats-metrics";
import { hasCategoryData, type PlayerMatchStats, type StatCategory } from "@/lib/match-result-schema";

export type StatFieldDef = {
  key: string;
  label: string;
  derived?: "attackScore" | "attackError" | "blockRating" | "defenseRate" | "passRating" | "serveRating";
};

/** 各分類欄位定義（註解：對齊 Excel 模板）。 */
export const CATEGORY_FIELDS: Record<StatCategory, StatFieldDef[]> = {
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

export function derivedStatValue(
  stats: PlayerMatchStats,
  derived: NonNullable<StatFieldDef["derived"]>,
): string {
  switch (derived) {
    case "attackScore":
      return formatPct(computeAttackRates(stats).scoreRate);
    case "attackError":
      return formatPct(computeAttackRates(stats).errorRate);
    case "blockRating":
      return formatRating(computeBlockRating(stats));
    case "defenseRate":
      return formatPct(computeDefenseRate(stats));
    case "passRating":
      return formatRating(computePassRating(stats));
    case "serveRating":
      return formatRating(computeServeRating(stats));
  }
}

/** 手機列表摘要（註解：一行顯示是否已填）。 */
export function categorySummary(stats: PlayerMatchStats, category: StatCategory): string {
  if (!hasCategoryData(stats, category)) return "尚未填寫";

  switch (category) {
    case "attack": {
      const a = stats.attack!;
      return `${a.attempts}次 · ${a.points}分 · ${a.errors}誤`;
    }
    case "block": {
      const b = stats.block!;
      return `${b.attempts}次 · ${b.points}分 · 有效${b.effective}`;
    }
    case "defense": {
      const d = stats.defense!;
      return `${d.attempts}次 · 成功${d.success}`;
    }
    case "pass": {
      const p = stats.pass!;
      return `A${p.perfect} B${p.good} C${p.poor}${p.aced ? ` · 被ACE${p.aced}` : ""}`;
    }
    case "serve": {
      const s = stats.serve!;
      return `A${s.strong} B${s.normal} C${s.weak}${s.aces ? ` · ACE${s.aces}` : ""}`;
    }
    case "other":
      return `失誤 ${stats.other!.errors}`;
  }
}
