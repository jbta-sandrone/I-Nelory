import { prisma } from "../config/prisma.js";
import {
  STORAGE_ALERT_THRESHOLDS,
  USER_STORAGE_LIMIT_BYTES,
} from "../constants/storage.constants.js";
import { notifyUser } from "./notification.service.js";

type StorageClient = {
  memory: {
    findMany: (args: unknown) => Promise<Array<{
      mediaUrl: string | null;
      mediaPublicId: string | null;
      mediaSizeBytes: bigint | null;
      mediaType: string | null;
      isArchived: boolean;
    }>>;
  };
};

export type StorageUsageSnapshot = {
  usedBytes: number;
  totalMemories: number;
  totalMediaFiles: number;
  imageCount: number;
  videoCount: number;
  archivedCount: number;
  imageBytes: number;
  videoBytes: number;
  archivedBytes: number;
  unknownMediaCount: number;
  hasUnknownUsage: boolean;
};

export type StorageErrorDetails = {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  incomingFileSizeBytes: number;
  unknownMediaCount?: number;
  hasUnknownUsage?: boolean;
};

export type StorageErrorCode =
  | "STORAGE_LIMIT_EXCEEDED"
  | "STORAGE_METADATA_REQUIRED";

export class StorageQuotaError extends Error {
  readonly statusCode = 413;
  readonly code: StorageErrorCode;
  readonly details: StorageErrorDetails;

  constructor(
    message: string,
    code: StorageErrorCode,
    details: StorageErrorDetails,
  ) {
    super(message);
    this.name = "StorageQuotaError";
    this.code = code;
    this.details = details;
  }
}

function hasMedia(memory: {
  mediaUrl: string | null;
  mediaPublicId: string | null;
}) {
  return Boolean(memory.mediaUrl || memory.mediaPublicId);
}

export async function calculateStorageUsage(
  userId: string,
  client: StorageClient = prisma as unknown as StorageClient,
): Promise<StorageUsageSnapshot> {
  const memories = await client.memory.findMany({
    where: { userId },
    select: {
      mediaUrl: true,
      mediaPublicId: true,
      mediaSizeBytes: true,
      mediaType: true,
      isArchived: true,
    },
  });

  let usedBytes = 0;
  let imageBytes = 0;
  let videoBytes = 0;
  let archivedBytes = 0;
  let imageCount = 0;
  let videoCount = 0;
  let archivedCount = 0;
  let totalMediaFiles = 0;
  let unknownMediaCount = 0;

  for (const memory of memories) {
    if (memory.isArchived) {
      archivedCount += 1;
    }

    if (!hasMedia(memory)) {
      continue;
    }

    totalMediaFiles += 1;
    const isVideo = memory.mediaType?.toUpperCase() === "VIDEO";

    if (isVideo) {
      videoCount += 1;
    } else {
      imageCount += 1;
    }

    if (memory.mediaSizeBytes === null) {
      unknownMediaCount += 1;
      continue;
    }

    const sizeBytes = Number(memory.mediaSizeBytes);
    usedBytes += sizeBytes;

    if (isVideo) {
      videoBytes += sizeBytes;
    } else {
      imageBytes += sizeBytes;
    }

    if (memory.isArchived) {
      archivedBytes += sizeBytes;
    }
  }

  return {
    usedBytes,
    totalMemories: memories.length,
    totalMediaFiles,
    imageCount,
    videoCount,
    archivedCount,
    imageBytes,
    videoBytes,
    archivedBytes,
    unknownMediaCount,
    hasUnknownUsage: unknownMediaCount > 0,
  };
}

export function getStorageSummary(snapshot: StorageUsageSnapshot) {
  const remainingBytes = Math.max(
    0,
    USER_STORAGE_LIMIT_BYTES - snapshot.usedBytes,
  );
  const usagePercentage = Math.min(
    100,
    Math.max(0, (snapshot.usedBytes / USER_STORAGE_LIMIT_BYTES) * 100),
  );

  return {
    ...snapshot,
    limitBytes: USER_STORAGE_LIMIT_BYTES,
    remainingBytes,
    usagePercentage,
  };
}

export function assertUploadFitsQuota(
  snapshot: StorageUsageSnapshot,
  incomingFileSizeBytes: number,
  replacedMediaSizeBytes = 0,
) {
  const remainingBytes = Math.max(
    0,
    USER_STORAGE_LIMIT_BYTES - snapshot.usedBytes,
  );
  const details: StorageErrorDetails = {
    usedBytes: snapshot.usedBytes,
    limitBytes: USER_STORAGE_LIMIT_BYTES,
    remainingBytes,
    incomingFileSizeBytes,
    unknownMediaCount: snapshot.unknownMediaCount,
    hasUnknownUsage: snapshot.hasUnknownUsage,
  };

  if (snapshot.hasUnknownUsage) {
    throw new StorageQuotaError(
      "Storage metadata synchronization is required before uploading new media.",
      "STORAGE_METADATA_REQUIRED",
      details,
    );
  }

  const projectedUsage =
    snapshot.usedBytes - replacedMediaSizeBytes + incomingFileSizeBytes;

  if (projectedUsage > USER_STORAGE_LIMIT_BYTES) {
    throw new StorageQuotaError(
      "Storage limit exceeded. Delete some memories before uploading new media.",
      "STORAGE_LIMIT_EXCEEDED",
      details,
    );
  }
}

export async function withUserStorageLock<T>(
  userId: string,
  operation: (
    transaction: unknown,
    snapshot: StorageUsageSnapshot,
  ) => Promise<T>,
) {
  // PostgreSQL advisory locks serialize every quota-sensitive operation for a
  // user across server processes without storing a denormalized usage total.
  return prisma.$transaction(
    async (transaction) => {
      await transaction.$executeRaw`
        SELECT pg_advisory_xact_lock(hashtextextended(${userId}, 0))
      `;
      const snapshot = await calculateStorageUsage(
        userId,
        transaction as unknown as StorageClient,
      );
      return operation(transaction, snapshot);
    },
    {
      maxWait: 10_000,
      timeout: 60_000,
    },
  );
}

export async function notifyStorageThresholdCrossing(
  userId: string,
  previousUsedBytes: number,
  nextUsedBytes: number,
) {
  const previousPercentage =
    (previousUsedBytes / USER_STORAGE_LIMIT_BYTES) * 100;
  const nextPercentage = (nextUsedBytes / USER_STORAGE_LIMIT_BYTES) * 100;
  const crossedThreshold = [...STORAGE_ALERT_THRESHOLDS]
    .reverse()
    .find(
      (threshold) =>
        previousPercentage < threshold && nextPercentage >= threshold,
    );

  if (!crossedThreshold) {
    return;
  }

  const title = crossedThreshold === 100
    ? "Storage full"
    : `Storage ${crossedThreshold}% full`;
  const message = crossedThreshold === 100
    ? "New memory uploads are blocked until media is permanently deleted."
    : "Your memory storage is running low. Review large media files when convenient.";

  await notifyUser({
    userId,
    title,
    message,
    category: "Storage",
    type: crossedThreshold >= 90 ? "WARNING" : "INFO",
    icon: "▣",
    actionType: "storage",
    groupKey: `storage-threshold:${crossedThreshold}`,
    canGroup: false,
  });
}
