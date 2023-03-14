-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('Warn', 'Restrict', 'Unrestrict', 'Mute', 'Unmute', 'Kick', 'Softban', 'Ban', 'MultiBan', 'Unban', 'Slowmode', 'Lockdown');

-- CreateEnum
CREATE TYPE "EndAutomation" AS ENUM ('None', 'End', 'Roll', 'Publish');

-- CreateEnum
CREATE TYPE "HostNotified" AS ENUM ('None', 'BufferBefore', 'OnEnd');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('User', 'Message');

-- CreateTable
CREATE TABLE "Autorole" (
    "guildId" TEXT NOT NULL,
    "activated" BOOLEAN NOT NULL DEFAULT false,
    "lastEditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roleIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Autorole_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "guildRelativeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "CaseType" NOT NULL,
    "daysPruned" INTEGER,
    "dmMessageId" TEXT,
    "expiration" TIMESTAMP(3),
    "logMessageChannelId" TEXT,
    "logMessageId" TEXT,
    "moderatorUserId" TEXT NOT NULL,
    "moderatorUserTag" TEXT NOT NULL,
    "noteId" INTEGER,
    "originalSlowmode" INTEGER,
    "persistant" BOOLEAN,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "referenceId" INTEGER,
    "reportId" INTEGER,
    "roles" TEXT[],
    "targetIds" TEXT[],
    "targetUserTag" TEXT,
    "temporary" BOOLEAN,
    "newSlowmode" INTEGER,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Giveaway" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "guildRelativeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "announcementMessageId" TEXT,
    "announcementMessageUpdated" BOOLEAN NOT NULL DEFAULT false,
    "channelId" TEXT,
    "description" TEXT NOT NULL,
    "endAutomation" "EndAutomation" NOT NULL DEFAULT 'End',
    "endDate" TIMESTAMP(3),
    "ended" BOOLEAN NOT NULL DEFAULT false,
    "entriesLocked" BOOLEAN NOT NULL DEFAULT false,
    "entriesUserIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hostNotified" "HostNotified" NOT NULL DEFAULT 'None',
    "hostUserId" TEXT NOT NULL,
    "hostUserTag" TEXT NOT NULL,
    "lastEditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "minimumAccountAge" TEXT,
    "pingRolesIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredRolesIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "title" TEXT NOT NULL,
    "winnerMessageId" TEXT,
    "winnerMessageUpdated" BOOLEAN NOT NULL DEFAULT false,
    "winnerQuantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Giveaway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guildUserRelativeId" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorTag" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userTag" TEXT NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prize" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "additionalInfo" TEXT,
    "giveawayId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Prize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" SERIAL NOT NULL,
    "guildId" TEXT NOT NULL,
    "guildRelativeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ReportType" NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "authorUserId" TEXT NOT NULL,
    "authorUserTag" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3),
    "processedByUserId" TEXT,
    "processedByUserTag" TEXT,
    "targetMessageId" TEXT,
    "targetUserId" TEXT NOT NULL,
    "targetUserTag" TEXT NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Config" (
    "guildId" TEXT NOT NULL,
    "caseLogChannelId" TEXT,
    "caseLogEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastEditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberLogChannelId" TEXT,
    "memberLogEnabled" BOOLEAN NOT NULL DEFAULT false,
    "messageLogChannelId" TEXT,
    "messageLogEnabled" BOOLEAN NOT NULL DEFAULT false,
    "pinArchiveChannelId" TEXT,
    "protectedChannelsIds" TEXT[],
    "reportChannelId" TEXT,
    "reportEnabled" BOOLEAN NOT NULL DEFAULT false,
    "restrictRolesIds" TEXT[],

    CONSTRAINT "Config_pkey" PRIMARY KEY ("guildId")
);

-- CreateTable
CREATE TABLE "Winner" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "prizeId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Winner_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "Case"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prize" ADD CONSTRAINT "Prize_giveawayId_fkey" FOREIGN KEY ("giveawayId") REFERENCES "Giveaway"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Winner" ADD CONSTRAINT "Winner_prizeId_fkey" FOREIGN KEY ("prizeId") REFERENCES "Prize"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
