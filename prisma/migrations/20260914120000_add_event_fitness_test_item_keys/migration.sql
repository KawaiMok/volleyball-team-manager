-- AlterTable：體能測試事件可指定進行項目（null 表示全部 6 項，向後相容）
ALTER TABLE "Event" ADD COLUMN "fitnessTestItemKeys" JSONB;
