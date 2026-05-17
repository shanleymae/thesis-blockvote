-- Backfill schema pieces that exist in the current Prisma schema but were not
-- captured in the older migration history. These guards keep the migration
-- safe for databases that already have the organization/scope changes.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ElectionScope') THEN
        CREATE TYPE "ElectionScope" AS ENUM ('GLOBAL', 'ORGANIZATION');
    END IF;
END $$;

ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERADMIN';

CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_name_key" ON "Organization"("name");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "canCreateGlobalElections" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Election" ADD COLUMN IF NOT EXISTS "scope" "ElectionScope" NOT NULL DEFAULT 'GLOBAL';
ALTER TABLE "Election" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_organizationId_fkey') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Election_organizationId_fkey') THEN
        ALTER TABLE "Election" ADD CONSTRAINT "Election_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- CreateTable
CREATE TABLE "ElectionGroup" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "scope" "ElectionScope" NOT NULL DEFAULT 'GLOBAL',
    "organizationId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "ElectionStatus" NOT NULL DEFAULT 'UPCOMING',
    "resultsPublished" BOOLEAN NOT NULL DEFAULT false,
    "resultsPublishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionGroup_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Election" ADD COLUMN "groupId" TEXT,
ADD COLUMN "positionTitle" TEXT,
ADD COLUMN "positionOrder" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "ElectionGroup" ADD CONSTRAINT "ElectionGroup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Election" ADD CONSTRAINT "Election_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ElectionGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;
