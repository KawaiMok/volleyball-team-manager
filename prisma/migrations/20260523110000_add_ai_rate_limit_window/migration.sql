-- AI 限流窗口（註解：多 instance 共用 per-team 計數）
CREATE TABLE "AiRateLimitWindow" (
    "teamId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiRateLimitWindow_pkey" PRIMARY KEY ("teamId")
);
