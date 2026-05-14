/** 隊伍分組標籤：讀寫 `Team.groupConfig`（註解：與行事曆／事件參與者篩選一致）。 */

export function parseGroupConfig(config: unknown): string[] {
  if (Array.isArray(config) && config.every((x) => typeof x === "string")) {
    return config as string[];
  }
  return [];
}

/** 正規化後寫入 DB：去空、去重、單筆與總數上限（註解：避免過長標籤或清單）。 */
export function normalizeGroupConfigLabels(raw: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of raw) {
    const t = s.trim();
    if (!t || t.length > 32) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 20) break;
  }
  return out;
}

/** 將多行文字轉成分組陣列（註解：設定表單用）。 */
export function parseGroupConfigLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}
