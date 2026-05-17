ALTER TABLE "Election"
ADD COLUMN "resultsPublished" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "resultsPublishedAt" TIMESTAMP(3);
