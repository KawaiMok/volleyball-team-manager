-- 體能測試：新增 EventType 與 FitnessTestSession / FitnessTestResult

ALTER TYPE "EventType" ADD VALUE 'FITNESS_TEST';

CREATE TABLE "FitnessTestSession" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "protocolNote" TEXT,
    "equipmentNote" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitnessTestSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FitnessTestResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "stats" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FitnessTestResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FitnessTestSession_eventId_key" ON "FitnessTestSession"("eventId");

CREATE UNIQUE INDEX "FitnessTestResult_sessionId_memberId_key" ON "FitnessTestResult"("sessionId", "memberId");

CREATE INDEX "FitnessTestResult_memberId_idx" ON "FitnessTestResult"("memberId");

ALTER TABLE "FitnessTestSession" ADD CONSTRAINT "FitnessTestSession_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FitnessTestResult" ADD CONSTRAINT "FitnessTestResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FitnessTestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FitnessTestResult" ADD CONSTRAINT "FitnessTestResult_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
