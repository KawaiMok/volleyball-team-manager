/**
 * 極簡 in-memory 限流（註解：MVP 用；多 instance 部署需改 Redis 等）。
 */
const buckets = new Map<string, { count: number; windowStart: number }>();

const WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_MAX = 30;

export function checkAiRateLimit(teamId: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const max = Number(process.env.AI_RATE_LIMIT_PER_TEAM_PER_HOUR ?? DEFAULT_MAX);
  const now = Date.now();
  let b = buckets.get(teamId);
  if (!b || now - b.windowStart > WINDOW_MS) {
    b = { count: 0, windowStart: now };
    buckets.set(teamId, b);
  }
  if (b.count >= max) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - b.windowStart)) / 1000);
    return { ok: false, retryAfterSec };
  }
  b.count += 1;
  return { ok: true };
}
