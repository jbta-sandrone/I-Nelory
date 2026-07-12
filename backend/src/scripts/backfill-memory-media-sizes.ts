import { prisma } from "../config/prisma.js";
import { getMemoryMediaResource } from "../services/cloudinary.service.js";
import {
  notifyStorageThresholdCrossing,
  withUserStorageLock,
} from "../services/storage.service.js";

async function backfillMemoryMediaMetadata() {
  const memories = await prisma.memory.findMany({
    where: {
      mediaPublicId: { not: null },
      OR: [
        { mediaSizeBytes: null },
        { mediaWidth: null },
        { mediaHeight: null },
        {
          mediaType: "VIDEO",
          mediaDurationSeconds: null,
        },
      ],
    },
    select: {
      id: true,
      userId: true,
      mediaPublicId: true,
      mediaType: true,
      mediaSizeBytes: true,
      mediaWidth: true,
      mediaHeight: true,
      mediaDurationSeconds: true,
    },
  });

  console.log(`Found ${memories.length} memories requiring media metadata.`);

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

          const updates: {
            mediaSizeBytes?: bigint;
            mediaWidth?: number;
            mediaHeight?: number;
            mediaDurationSeconds?: number;
          } = {};

          if (memory.mediaSizeBytes === null && Number.isFinite(resource.bytes)) {
            updates.mediaSizeBytes = BigInt(resource.bytes!);
          }

          if (memory.mediaWidth === null && Number.isFinite(resource.width)) {
            updates.mediaWidth = resource.width!;
          }

          if (memory.mediaHeight === null && Number.isFinite(resource.height)) {
            updates.mediaHeight = resource.height!;
          }

          if (
            memory.mediaType === "VIDEO" &&
            memory.mediaDurationSeconds === null &&
            Number.isFinite(resource.duration)
          ) {
            updates.mediaDurationSeconds = resource.duration!;
          }

          if (Object.keys(updates).length === 0) {
            return {
              updatedFields: [] as string[],
              addedBytes: 0,
              previousUsedBytes: snapshot.usedBytes,
              nextUsedBytes: snapshot.usedBytes,
            };
          }

          await (transaction as any).memory.update({
            where: { id: memory.id },
            data: updates,
          });

          const addedBytes =
            memory.mediaSizeBytes === null && updates.mediaSizeBytes
              ? Number(updates.mediaSizeBytes)
              : 0;

          return {
            updatedFields: Object.keys(updates),
            addedBytes,
            previousUsedBytes: snapshot.usedBytes,
            nextUsedBytes: snapshot.usedBytes + addedBytes,
          };
        },
      );

      if (result.updatedFields.length === 0) {
        console.log(`Skipped ${memory.id}: Cloudinary returned no missing metadata.`);
        continue;
      }

      console.log(`Updated ${memory.id}: ${result.updatedFields.join(", ")}.`);

      if (result.addedBytes > 0) {
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
      }
    } catch (error) {
      console.warn(
        `Skipped ${memory.id} (${memory.mediaPublicId}):`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

backfillMemoryMediaMetadata()
  .catch((error) => {
    console.error("Media metadata backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
