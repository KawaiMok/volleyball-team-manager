-- 個人數據改為 JSON 細項（對齊 Excel 六大分類）

ALTER TABLE "MatchPlayerStat" ADD COLUMN "stats" JSONB NOT NULL DEFAULT '{}';

-- 將舊 5 欄映射至 stats（註解：保留既有資料可讀性）
UPDATE "MatchPlayerStat"
SET "stats" = jsonb_build_object(
  'pass', jsonb_build_object('perfect', "reception", 'good', 0, 'poor', 0, 'aced', 0),
  'defense', jsonb_build_object('attempts', "defense", 'success', "defense", 'errors', 0),
  'attack', jsonb_build_object('attempts', "attack", 'points', "attack", 'errors', 0),
  'block', jsonb_build_object('attempts', "block", 'effective', "block", 'errors', 0, 'points', 0),
  'serve', jsonb_build_object('strong', "serve", 'normal', 0, 'weak', 0, 'errors', 0, 'aces', 0)
)
WHERE "reception" > 0 OR "defense" > 0 OR "attack" > 0 OR "block" > 0 OR "serve" > 0;

ALTER TABLE "MatchPlayerStat" DROP COLUMN "reception";
ALTER TABLE "MatchPlayerStat" DROP COLUMN "defense";
ALTER TABLE "MatchPlayerStat" DROP COLUMN "attack";
ALTER TABLE "MatchPlayerStat" DROP COLUMN "block";
ALTER TABLE "MatchPlayerStat" DROP COLUMN "serve";
