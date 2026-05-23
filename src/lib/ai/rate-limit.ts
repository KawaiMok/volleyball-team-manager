import { getPrisma } from "@/lib/prisma";

const WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_MAX = 30;

/** in-memory 後援（註解：DB 不可用時）。 */
const memoryBuckets = new Map<string, { count: number; windowStart: number }>();

function checkAiRateLimitInMemory(
  teamId: string,
): { ok: true } | { ok: false; retryAfterSec: number } {
  const max = Number(process.env.AI_RATE_LIMIT_PER_TEAM_PER_HOUR ?? DEFAULT_MAX);
  const now = Date.now();
  let bucket = memoryBuckets.get(teamId);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    bucket = { count: 0, windowStart: now };
    memoryBuckets.set(teamId, bucket);
  }
  if (bucket.count >= max) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - bucket.windowStart)) / 1000);
    return { ok: false, retryAfterSec };
  }
  bucket.count += 1;
  return { ok: true };
}

/**
 * 每隊每小時 AI 呼叫上限（註解：以 DB 計數，多 instance 共用；失敗時 fallback in-memory）。
 */
export async function checkAiRateLimit(
  teamId: string,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const max = Number(process.env.AI_RATE_LIMIT_PER_TEAM_PER_HOUR ?? DEFAULT_MAX);
  const nowMs = Date.now();

  try {
    return await getPrisma().$transaction(async (tx) => {
      const row = await tx.aiRateLimitWindow.findUnique({ where: { teamId } });

      if (!row || nowMs - row.windowStart.getTime() > WINDOW_MS) {
        await tx.aiRateLimitWindow.upsert({
          where: { teamId },
          create: { teamId, windowStart: new Date(nowMs), count: 1 },
          update: { windowStart: new Date(nowMs), count: 1 },
        });
        return { ok: true as const };
      }

      if (row.count >= max) {
        const retryAfterSec = Math.ceil(
          (WINDOW_MS - (nowMs - row.windowStart.getTime())) / 1000,
        );
        return { ok: false as const, retryAfterSec };
      }

      await tx.aiRateLimitWindow.update({
        where: { teamId },
        data: { count: row.count + 1 },
      });
      return { ok: true as const };
    });
  } catch (error) {
    console.error("[ai-rate-limit] DB unavailable, using in-memory fallback", error);
    return checkAiRateLimitInMemory(teamId);
  }
}
