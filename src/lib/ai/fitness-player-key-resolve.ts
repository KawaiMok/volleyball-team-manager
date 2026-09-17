import { formatPlayerKeyLabel } from "@/lib/ai/fitness-prompt-format";

/** playerKey 與顯示姓名對照（註解：AI 回傳後還原用）。 */
export type PlayerKeyDisplayMapping = {
  playerKey: string;
  displayName: string;
  jerseyNumber: number | null;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * 將 AI 文字中的 playerKey（如 P1、P2）還原為隊員姓名。
 * 註解：先替換「P1（背號 N）」完整標籤，再以數字邊界替換裸 key，避免 P1 誤改 P10。
 */
export function replacePlayerKeysWithDisplayNames(
  text: string,
  mappings: PlayerKeyDisplayMapping[],
): string {
  if (!text.trim() || mappings.length === 0) return text;

  const sorted = [...mappings].sort((a, b) => b.playerKey.length - a.playerKey.length);
  const tokenToName = new Map<string, string>();
  let result = text;

  sorted.forEach((mapping, index) => {
    const token = `\x00PLAYER_KEY_${index}\x00`;
    tokenToName.set(token, mapping.displayName);

    const keyLabel = formatPlayerKeyLabel(mapping.playerKey, mapping.jerseyNumber);
    if (keyLabel !== mapping.playerKey) {
      result = result.replaceAll(keyLabel, token);
    }

    const escapedKey = escapeRegExp(mapping.playerKey);
    const bareKeyPattern = new RegExp(`(?<![0-9])${escapedKey}(?![0-9])`, "g");
    result = result.replace(bareKeyPattern, token);
  });

  for (const [token, displayName] of tokenToName) {
    result = result.replaceAll(token, displayName);
  }

  return result;
}
