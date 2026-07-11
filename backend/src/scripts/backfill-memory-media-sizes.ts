import { prisma } from "../config/prisma.js";
import { getMemoryMediaResource } from "../services/cloudinary.service.js";
import {
  notifyStorageThresholdCrossing,
  withUserStorageLock,
} from "../services/storage.service.js";

async function backfillMemoryMediaSizes() {
  const memories = await prisma.memory.findMany({
    where: {
      mediaPublicId: { not: null },
      mediaSizeBytes: null,
    },
    select: {
      id: true,
      userId: true,
      mediaPublicId: true,
      mediaType: true,
    },
  });

  console.log(`Found ${memories.length} memories requiring storage metadata.`);

  for (const memory of memories) {
    if (!memory.mediaPublicId) {
      continue;
    }

    const resourceType = memory.mediaType === "VIDEO" ? "video" : "image";

    try {
      const result = await withUserStorageLock(
        memory.userId,
        async (transaction, snapshot) => {
          const resource = await getMemoryMediaResource(
            memory.mediaPublicId!,
            resourceType,
          );

          if (!Number.isFinite(resource.bytes)) {
            throw new Error("Cloudinary did not return a byte size.");
          }

          await (transaction as any).memory.update({
            where: { id: memory.id },
            data: { mediaSizeBytes: BigInt(resource.bytes!) },
          });
          return {
            bytes: resource.bytes!,
            previousUsedBytes: snapshot.usedBytes,
            nextUsedBytes: snapshot.usedBytes + resource.bytes!,
          };
        },
      );
      console.log(`Updated ${memory.id}: ${result.bytes} bytes.`);

      try {
        await notifyStorageThresholdCrossing(
          memory.userId,
          result.previousUsedBytes,
          result.nextUsedBytes,
        );
      } catch (notificationError) {
        console.warn(
          `Storage alert failed for ${memory.id}:`,
          notificationError instanceof Error
            ? notificationError.message
            : notificationError,
        );
      }
    } catch (error) {
      console.warn(
        `Skipped ${memory.id} (${memory.mediaPublicId}):`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

backfillMemoryMediaSizes()
  .catch((error) => {
    console.error("Storage metadata backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
