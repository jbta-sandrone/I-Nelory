-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "actionId" TEXT,
ADD COLUMN     "actionType" TEXT,
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Account',
ADD COLUMN     "groupCount" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "groupKey" TEXT,
ADD COLUMN     "icon" TEXT;
