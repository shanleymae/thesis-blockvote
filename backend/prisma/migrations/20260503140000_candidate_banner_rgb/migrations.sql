-- Move banner RGB from Election to Candidate (per-candidate public profile).

ALTER TABLE "Election" DROP COLUMN IF EXISTS "bannerBgR";
ALTER TABLE "Election" DROP COLUMN IF EXISTS "bannerBgG";
ALTER TABLE "Election" DROP COLUMN IF EXISTS "bannerBgB";
ALTER TABLE "Election" DROP COLUMN IF EXISTS "bannerAccentR";
ALTER TABLE "Election" DROP COLUMN IF EXISTS "bannerAccentG";
ALTER TABLE "Election" DROP COLUMN IF EXISTS "bannerAccentB";

ALTER TABLE "Candidate" ADD COLUMN "bannerBgR" INTEGER;
ALTER TABLE "Candidate" ADD COLUMN "bannerBgG" INTEGER;
ALTER TABLE "Candidate" ADD COLUMN "bannerBgB" INTEGER;
ALTER TABLE "Candidate" ADD COLUMN "bannerAccentR" INTEGER;
ALTER TABLE "Candidate" ADD COLUMN "bannerAccentG" INTEGER;
ALTER TABLE "Candidate" ADD COLUMN "bannerAccentB" INTEGER;
