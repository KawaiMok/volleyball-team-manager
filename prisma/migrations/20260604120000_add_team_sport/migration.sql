-- 多運動擴展 Phase 0：隊伍運動類型（既有隊伍預設排球）
CREATE TYPE "Sport" AS ENUM ('VOLLEYBALL', 'SOCCER', 'BASKETBALL');

ALTER TABLE "Team" ADD COLUMN "sport" "Sport" NOT NULL DEFAULT 'VOLLEYBALL';
