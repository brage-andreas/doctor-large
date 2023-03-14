/*
  Warnings:

  - The values [Publish] on the enum `EndAutomation` will be removed. If these variants are still used in the database, this will fail.
  - The values [BufferBefore] on the enum `HostNotified` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EndAutomation_new" AS ENUM ('None', 'End', 'Roll', 'Announce');
ALTER TABLE "Giveaway" ALTER COLUMN "endAutomation" DROP DEFAULT;
ALTER TABLE "Giveaway" ALTER COLUMN "endAutomation" TYPE "EndAutomation_new" USING ("endAutomation"::text::"EndAutomation_new");
ALTER TYPE "EndAutomation" RENAME TO "EndAutomation_old";
ALTER TYPE "EndAutomation_new" RENAME TO "EndAutomation";
DROP TYPE "EndAutomation_old";
ALTER TABLE "Giveaway" ALTER COLUMN "endAutomation" SET DEFAULT 'End';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "HostNotified_new" AS ENUM ('None', 'BeforeEnd', 'OnEnd');
ALTER TABLE "Giveaway" ALTER COLUMN "hostNotified" DROP DEFAULT;
ALTER TABLE "Giveaway" ALTER COLUMN "hostNotified" TYPE "HostNotified_new" USING ("hostNotified"::text::"HostNotified_new");
ALTER TYPE "HostNotified" RENAME TO "HostNotified_old";
ALTER TYPE "HostNotified_new" RENAME TO "HostNotified";
DROP TYPE "HostNotified_old";
ALTER TABLE "Giveaway" ALTER COLUMN "hostNotified" SET DEFAULT 'None';
COMMIT;
