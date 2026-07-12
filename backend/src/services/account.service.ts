import bcrypt from "bcryptjs";
import { ZipArchive } from "archiver";
import type { Response } from "express";
import { prisma } from "../config/prisma.js";
import { USER_STORAGE_LIMIT_BYTES } from "../constants/storage.constants.js";
import { deleteAccountCloudinaryResource } from "./cloudinary.service.js";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
} from "./notification-preference.service.js";
import { DEFAULT_PRIVACY_PREFERENCES } from "./privacy-preference.service.js";
import { calculateStorageUsage, getStorageSummary } from "./storage.service.js";

const ACCOUNT_DELETION_PHRASE = "DELETE MY ACCOUNT";
const CLOUDINARY_DELETE_CONCURRENCY = 3;

type CloudinaryResource = {
  publicId: string;
  resourceType: "image" | "video";
};

export class AccountRequestError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AccountRequestError";
    this.statusCode = statusCode;
  }
}

function jsonFile(value: unknown) {
  return JSON.stringify(
    value,
    (_key, item) => (typeof item === "bigint" ? item.toString() : item),
    2,
  );
}

function exportFilename(date: Date) {
  return `i-nelory-export-${date.toISOString().slice(0, 10)}.zip`;
}

async function getPortableAccountData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      emailVerified: true,
      bio: true,
      location: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
      memories: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          mediaUrl: true,
          mediaPublicId: true,
          mediaType: true,
          mediaSizeBytes: true,
          mediaWidth: true,
          mediaHeight: true,
          mediaDurationSeconds: true,
          memoryDate: true,
          location: true,
          albumId: true,
          isFavorite: true,
          isArchived: true,
          createdAt: true,
          updatedAt: true,
          tags: {
            select: {
              id: true,
              name: true,
              color: true,
            },
            orderBy: { name: "asc" },
          },
        },
      },
      albums: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          coverUrl: true,
          coverPublicId: true,
          createdAt: true,
          updatedAt: true,
          memories: {
            select: { id: true },
            orderBy: { createdAt: "asc" },
          },
        },
      },
      notificationPreference: {
        select: {
          notifyMemoryActivity: true,
          notifyAlbumActivity: true,
          notifyFavoriteActivity: true,
          notifyAiSearch: true,
          notifyMemoryReminders: true,
          notifyOnThisDay: true,
          notifyStorageAlerts: true,
          updatedAt: true,
        },
      },
      privacyPreference: {
        select: {
          confirmBeforeDelete: true,
          allowAiSearch: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new AccountRequestError("Account not found.", 404);
  }

  const storage = getStorageSummary(await calculateStorageUsage(userId));
  const profile = {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    emailVerified: user.emailVerified,
    bio: user.bio,
    location: user.location,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  const memories = user.memories.map((memory) => ({
    id: memory.id,
    title: memory.title,
    description: memory.description,
    caption: memory.description,
    mediaUrl: memory.mediaUrl,
    mediaPublicId: memory.mediaPublicId,
    mediaType: memory.mediaType,
    mediaSizeBytes:
      memory.mediaSizeBytes === null ? null : Number(memory.mediaSizeBytes),
    mediaWidth: memory.mediaWidth,
    mediaHeight: memory.mediaHeight,
    mediaDurationSeconds: memory.mediaDurationSeconds,
    memoryDate: memory.memoryDate,
    mood: null,
    location: memory.location,
    tags: memory.tags,
    albumId: memory.albumId,
    isFavorite: memory.isFavorite,
    isArchived: memory.isArchived,
    createdAt: memory.createdAt,
    updatedAt: memory.updatedAt,
  }));
  const albums = user.albums.map((album) => ({
    id: album.id,
    name: album.name,
    title: album.name,
    description: album.description,
    coverUrl: album.coverUrl,
    coverPublicId: album.coverPublicId,
    memoryIds: album.memories.map((memory) => memory.id),
    createdAt: album.createdAt,
    updatedAt: album.updatedAt,
  }));
  const preferences = {
    appearance: {
      included: false,
      reason: "Appearance is stored as a device preference, not in the account database.",
    },
    notifications: {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(user.notificationPreference ?? {}),
    },
    privacy: {
      ...DEFAULT_PRIVACY_PREFERENCES,
      ...(user.privacyPreference ?? {}),
    },
    storage: {
      ...storage,
      quotaBytes: USER_STORAGE_LIMIT_BYTES,
    },
  };

  return { profile, memories, albums, preferences };
}

export async function streamAccountExport(userId: string, response: Response) {
  const createdAt = new Date();
  const data = await getPortableAccountData(userId);
  const archive = new ZipArchive({ zlib: { level: 9 } });
  const readme = [
    "I-Nelory Personal Data Export",
    "",
    `Created: ${createdAt.toISOString()}`,
    "",
    "This archive contains portable JSON copies of your profile, memories, albums, and account preferences.",
    "Media files are not embedded in this ZIP.",
    "mediaUrl entries point to files currently hosted for your I-Nelory account.",
    "Deleting your account later may invalidate those hosted URLs.",
    "This export contains personal data. Store it securely and share it only with people you trust.",
    "",
  ].join("\n");

  response.status(200);
  response.setHeader("Content-Type", "application/zip");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="${exportFilename(createdAt)}"`,
  );

  const completed = new Promise<void>((resolve, reject) => {
    archive.once("error", reject);
    response.once("finish", resolve);
    response.once("close", () => {
      if (!response.writableFinished) {
        reject(new Error("Export connection closed before completion"));
      }
    });
  });

  archive.pipe(response);
  archive.append(jsonFile(data.profile), { name: "profile.json" });
  archive.append(jsonFile(data.memories), { name: "memories.json" });
  archive.append(jsonFile(data.albums), { name: "albums.json" });
  archive.append(jsonFile(data.preferences), { name: "preferences.json" });
  archive.append(readme, { name: "README.txt" });
  await archive.finalize();
  await completed;
}

async function deleteResourcesWithBoundedConcurrency(
  resources: CloudinaryResource[],
) {
  let nextIndex = 0;
  const failures: unknown[] = [];

  const worker = async () => {
    while (nextIndex < resources.length) {
      const resource = resources[nextIndex];
      nextIndex += 1;

      try {
        await deleteAccountCloudinaryResource(
          resource.publicId,
          resource.resourceType,
        );
      } catch (error) {
        failures.push(error);
      }
    }
  };

  const workerCount = Math.min(
    CLOUDINARY_DELETE_CONCURRENCY,
    resources.length,
  );
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  if (failures.length > 0) {
    throw new Error("One or more account resources could not be removed");
  }
}

export async function deleteAccount(
  userId: string,
  currentPassword: string,
  confirmationPhrase: string,
) {
  if (!currentPassword) {
    throw new AccountRequestError("Current password is required.", 400);
  }

  if (confirmationPhrase.trim() !== ACCOUNT_DELETION_PHRASE) {
    throw new AccountRequestError("The confirmation phrase is incorrect.", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
      avatarPublicId: true,
      memories: {
        where: { mediaPublicId: { not: null } },
        select: {
          mediaPublicId: true,
          mediaType: true,
        },
      },
      albums: {
        where: { coverPublicId: { not: null } },
        select: { coverPublicId: true },
      },
    },
  });

  if (!user) {
    throw new AccountRequestError("Account not found.", 404);
  }

  const passwordMatches = await bcrypt.compare(currentPassword, user.password);

  if (!passwordMatches) {
    throw new AccountRequestError("Current password is incorrect.", 401);
  }

  const resourceMap = new Map<string, CloudinaryResource>();
  const addResource = (resource: CloudinaryResource) => {
    resourceMap.set(`${resource.resourceType}:${resource.publicId}`, resource);
  };

  if (user.avatarPublicId) {
    addResource({ publicId: user.avatarPublicId, resourceType: "image" });
  }

  user.albums.forEach((album) => {
    if (album.coverPublicId) {
      addResource({ publicId: album.coverPublicId, resourceType: "image" });
    }
  });

  user.memories.forEach((memory) => {
    if (memory.mediaPublicId) {
      addResource({
        publicId: memory.mediaPublicId,
        resourceType: memory.mediaType === "VIDEO" ? "video" : "image",
      });
    }
  });

  try {
    await deleteResourcesWithBoundedConcurrency([...resourceMap.values()]);
  } catch {
    throw new AccountRequestError(
      "Account cleanup could not be completed. Your account remains active; please try again.",
      502,
    );
  }

  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.user.delete({ where: { id: userId } });
    });
  } catch {
    throw new AccountRequestError(
      "The account could not be deleted. Please try again.",
      500,
    );
  }
}
