  import { prisma } from "../config/prisma.js";
  import { randomUUID } from "node:crypto";

  export const AI_SEARCH_DAILY_LIMIT = 3;
  export const AI_SEARCH_LIMIT_MESSAGE =
    "You have reached your daily AI Search limit of 3 searches. Please try again tomorrow.";

  type AiSearchUsageRow = {
    count: number;
  };

  export class AiSearchLimitError extends Error {
    statusCode = 429;
    remaining = 0;

    constructor() {
      super(AI_SEARCH_LIMIT_MESSAGE);
    }
  }

  export function getServerDayStart(date = new Date()) {
    const philippinesDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  
    return new Date(`${philippinesDate}T00:00:00.000Z`);
  }

  function toQuota(count: number) {
    const used = Math.max(0, count);

    return {
      limit: AI_SEARCH_DAILY_LIMIT,
      used,
      remaining: Math.max(0, AI_SEARCH_DAILY_LIMIT - used),
    };
  }

  export async function getAiSearchQuota(userId: string) {
    const usageDate = getServerDayStart();
    const usage = await prisma.$queryRaw<AiSearchUsageRow[]>`
      SELECT "count"
      FROM "AiSearchUsage"
      WHERE "userId" = ${userId}
        AND "usageDate" = ${usageDate}
      LIMIT 1
    `;

    return toQuota(usage[0]?.count ?? 0);
  }

  export async function assertAiSearchQuotaAvailable(userId: string) {
    const quota = await getAiSearchQuota(userId);

    if (quota.remaining <= 0) {
      throw new AiSearchLimitError();
    }

    return quota;
  }

  export async function incrementAiSearchUsage(userId: string) {
    const usageDate = getServerDayStart();
    const usage = await prisma.$queryRaw<AiSearchUsageRow[]>`
      INSERT INTO "AiSearchUsage" ("id", "userId", "usageDate", "count", "updatedAt")
      VALUES (${randomUUID()}, ${userId}, ${usageDate}, 1, CURRENT_TIMESTAMP)
      ON CONFLICT ("userId", "usageDate")
      DO UPDATE SET
        "count" = "AiSearchUsage"."count" + 1,
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "count"
    `;

    return toQuota(usage[0]?.count ?? AI_SEARCH_DAILY_LIMIT);
  }
