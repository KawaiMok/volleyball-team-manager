-- 比賽結果與個人數據

CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "opponentName" TEXT,
    "sets" JSONB NOT NULL,
    "teamStats" JSONB,
    "notes" TEXT,
    "recordedByMemberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatchResult_eventId_key" ON "MatchResult"("eventId");

CREATE TABLE "MatchPlayerStat" (
    "id" TEXT NOT NULL,
    "matchResultId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "reception" INTEGER NOT NULL DEFAULT 0,
    "defense" INTEGER NOT NULL DEFAULT 0,
    "attack" INTEGER NOT NULL DEFAULT 0,
    "block" INTEGER NOT NULL DEFAULT 0,
    "serve" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MatchPlayerStat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MatchPlayerStat_matchResultId_memberId_key" ON "MatchPlayerStat"("matchResultId", "memberId");
CREATE INDEX "MatchPlayerStat_memberId_idx" ON "MatchPlayerStat"("memberId");

ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_recordedByMemberId_fkey" FOREIGN KEY ("recordedByMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MatchPlayerStat" ADD CONSTRAINT "MatchPlayerStat_matchResultId_fkey" FOREIGN KEY ("matchResultId") REFERENCES "MatchResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchPlayerStat" ADD CONSTRAINT "MatchPlayerStat_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
