-- User Logo／Avatar 風格偏好

CREATE TYPE "BrandStyle" AS ENUM ('DEFAULT', 'CIQING');

ALTER TABLE "User" ADD COLUMN "brandStyle" "BrandStyle" NOT NULL DEFAULT 'DEFAULT';

-- 既有使用者維持原慈青視覺（註解：新註冊預設 DEFAULT）
UPDATE "User" SET "brandStyle" = 'CIQING' WHERE TRUE;
