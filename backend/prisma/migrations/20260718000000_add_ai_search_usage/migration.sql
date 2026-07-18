-- CreateTable
CREATE TABLE "AiSearchUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "usageDate" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSearchUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiSearchUsage_usageDate_idx" ON "AiSearchUsage"("usageDate");

-- CreateIndex
CREATE UNIQUE INDEX "AiSearchUsage_userId_usageDate_key" ON "AiSearchUsage"("userId", "usageDate");

-- AddForeignKey
ALTER TABLE "AiSearchUsage" ADD CONSTRAINT "AiSearchUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
