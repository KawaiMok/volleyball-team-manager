-- CreateEnum（註解：區分戰術板連結與影片／重播連結）
CREATE TYPE "FileAssetCategory" AS ENUM ('GENERAL', 'TACTICAL_BOARD', 'VIDEO');

-- AlterTable
ALTER TABLE "FileAsset" ADD COLUMN "category" "FileAssetCategory" NOT NULL DEFAULT 'GENERAL';
