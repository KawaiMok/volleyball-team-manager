-- AlterTable（註解：Clerk user id 對應，供正式登入）
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "clerkUserId" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "User_clerkUserId_key" ON "User"("clerkUserId");
