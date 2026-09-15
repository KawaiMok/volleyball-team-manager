-- 體能測試：每場次紀錄球員身高／體重
ALTER TABLE "FitnessTestResult" ADD COLUMN "heightCm" DOUBLE PRECISION;
ALTER TABLE "FitnessTestResult" ADD COLUMN "weightKg" DOUBLE PRECISION;
