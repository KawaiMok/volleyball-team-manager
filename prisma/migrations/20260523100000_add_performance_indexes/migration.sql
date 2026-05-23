-- 常用查詢複合索引（註解：事件列表、出席統計、留言、隊籍查詢）
CREATE INDEX "Event_teamId_startsAt_idx" ON "Event"("teamId", "startsAt");
CREATE INDEX "Event_teamId_status_startsAt_idx" ON "Event"("teamId", "status", "startsAt");
CREATE INDEX "TeamMember_userId_status_idx" ON "TeamMember"("userId", "status");
CREATE INDEX "Attendance_eventId_rsvpStatus_idx" ON "Attendance"("eventId", "rsvpStatus");
CREATE INDEX "Feedback_memberId_submittedAt_idx" ON "Feedback"("memberId", "submittedAt" DESC);
CREATE INDEX "Comment_eventId_createdAt_idx" ON "Comment"("eventId", "createdAt");
CREATE INDEX "FileAsset_eventId_idx" ON "FileAsset"("eventId");
