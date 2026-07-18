  import { prisma } from "../config/prisma.js";
  import { randomUUID } from "node:crypto";

  export const AI_SEARCH_DAILY_LIMIT = 3;
  export const AI_SEARCH_LIMIT_MESSAGE =
    "You have reached your daily AI Search limit of 3 searches. Please try again tomorrow.";

  type AiSearchUsageRow = {
    id: string;
    usageDate: Date;
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
  
    return new Date(`${philippinesDate}T00:00:00.000+08:00`);
  }

  function getServerDayRange(date = new Date()) {
    const start = getServerDayStart(date);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return { start, end };
  }

  function normalizeCount(count: number | bigint | null | undefined) {
    if (typeof count === "bigint") {
      return Number(count);
    }

    return Number(count ?? 0);
  }

  function toQuota(count: number) {
    const used = Math.max(0, count);

    return {
      limit: AI_SEARCH_DAILY_LIMIT,
      used,
      remaining: Math.max(0, AI_SEARCH_DAILY_LIMIT - used),
    };
  }

  export async function getAiSearchQuotaSnapshot(userId: string) {
    const { start: usageDate, end: nextUsageDate } = getServerDayRange();
    const quotaRow = await prisma.$queryRaw<AiSearchUsageRow[]>`
      SELECT "id", "usageDate", "count"
      FROM "AiSearchUsage"
      WHERE "userId" = ${userId}
        AND "usageDate" >= ${usageDate}
        AND "usageDate" < ${nextUsageDate}
      ORDER BY "usageDate" ASC
    `;
    const used = quotaRow.reduce(
      (total, usage) => total + normalizeCount(usage.count),
      0,
    );
    const quotaReturned = toQuota(used);

    console.log({
      userId,
      usageDate,
      quotaRow,
      quotaReturned,
    });

    return {
      usageDate,
      quotaRow,
      quotaReturned,
    };
  }

  export async function getAiSearchQuota(userId: string) {
    const { quotaReturned } = await getAiSearchQuotaSnapshot(userId);

    return quotaReturned;
  }

  export async function assertAiSearchQuotaAvailable(userId: string) {
    const quota = await getAiSearchQuota(userId);

    if (quota.remaining <= 0) {
      throw new AiSearchLimitError();
    }

    return quota;
  }

  export async function incrementAiSearchUsage(userId: string) {
    const { start: usageDate, end: nextUsageDate } = getServerDayRange();

    await prisma.$transaction(async (tx) => {
      const existingUsage = await tx.$queryRaw<AiSearchUsageRow[]>`
        SELECT "id", "usageDate", "count"
        FROM "AiSearchUsage"
        WHERE "userId" = ${userId}
          AND "usageDate" >= ${usageDate}
          AND "usageDate" < ${nextUsageDate}
        ORDER BY "usageDate" ASC
        LIMIT 1
        FOR UPDATE
      `;

      if (existingUsage[0]) {
        await tx.$executeRaw`
          UPDATE "AiSearchUsage"
          SET "count" = "count" + 1,
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = ${existingUsage[0].id}
        `;

        return;
      }

      await tx.$executeRaw`
        INSERT INTO "AiSearchUsage" ("id", "userId", "usageDate", "count", "updatedAt")
        VALUES (${randomUUID()}, ${userId}, ${usageDate}, 1, CURRENT_TIMESTAMP)
      `;
    });

    return getAiSearchQuota(userId);
  }
