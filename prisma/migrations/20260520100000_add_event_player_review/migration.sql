-- 教練對球員的場次私評（註解：僅教練與該球員可見）
CREATE TABLE "EventPlayerReview" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "authorMemberId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventPlayerReview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EventPlayerReview_eventId_memberId_key" ON "EventPlayerReview"("eventId", "memberId");

ALTER TABLE "EventPlayerReview" ADD CONSTRAINT "EventPlayerReview_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventPlayerReview" ADD CONSTRAINT "EventPlayerReview_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventPlayerReview" ADD CONSTRAINT "EventPlayerReview_authorMemberId_fkey" FOREIGN KEY ("authorMemberId") REFERENCES "TeamMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
