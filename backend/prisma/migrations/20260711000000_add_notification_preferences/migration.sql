-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notifyMemoryActivity" BOOLEAN NOT NULL DEFAULT true,
    "notifyAlbumActivity" BOOLEAN NOT NULL DEFAULT true,
    "notifyFavoriteActivity" BOOLEAN NOT NULL DEFAULT true,
    "notifyArchiveActivity" BOOLEAN NOT NULL DEFAULT true,
    "notifyAiSearch" BOOLEAN NOT NULL DEFAULT true,
    "notifyMemoryReminders" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnThisDay" BOOLEAN NOT NULL DEFAULT true,
    "notifyStorageAlerts" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
