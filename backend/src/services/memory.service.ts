import { prisma } from "../config/prisma.js";
import {
  MediaType,
  type MediaType as PrismaMediaType,
} from "../generated/prisma/client.js";
import { deleteMemoryImage, uploadMemoryImage } from "./cloudinary.service.js";
import {
  CreateMemoryRequest,
  UpdateMemoryRequest,
} from "../types/memory.types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { notifyUser } from "./notification.service.js";

type CloudinaryMemoryResourceType = "image" | "video";
const MAX_MEMORY_TAGS = 20;
const MAX_MEMORY_TAG_LENGTH = 40;

const memoryWithTagsInclude = {
  tags: {
    select: {
      id: true,
      name: true,
      color: true,
    },
    orderBy: {
      name: "asc" as const,
    },
  },
};

const getMediaTypeFromFile = (
  mediaFile: Express.Multer.File,
): PrismaMediaType => {
  return mediaFile.mimetype.startsWith("video/")
    ? MediaType.VIDEO
    : MediaType.IMAGE;
};

function normalizeMediaType(value?: string | null): PrismaMediaType {
  return value?.toUpperCase() === MediaType.VIDEO
    ? MediaType.VIDEO
    : MediaType.IMAGE;
}

function getCloudinaryResourceType(
  value?: string | null,
): CloudinaryMemoryResourceType {
  return normalizeMediaType(value) === MediaType.VIDEO ? "video" : "image";
}

function parseTagNames(value?: string[] | string | null) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return [];
  }

  let rawTags: unknown;

  if (Array.isArray(value)) {
    rawTags = value;
  } else if (value.trim().startsWith("[")) {
    try {
      rawTags = JSON.parse(value);
    } catch {
      rawTags = [];
    }
  } else {
    rawTags = value.split(",");
  }

  if (!Array.isArray(rawTags)) {
    return [];
  }

  const seenTags = new Set<string>();

  return rawTags
    .map((tag) => String(tag).trim())
    .map((tag) => tag.replace(/^#+/, "").trim())
    .map((tag) =>
      tag.length > MAX_MEMORY_TAG_LENGTH
        ? tag.slice(0, MAX_MEMORY_TAG_LENGTH).trim()
        : tag,
    )
    .filter((tag) => {
      if (!tag) {
        return false;
      }

      const key = tag.toLowerCase();

      if (seenTags.has(key)) {
        return false;
      }

      seenTags.add(key);
      return true;
    })
    .slice(0, MAX_MEMORY_TAGS);
}

async function getUserTagConnections(
  userId: string,
  value?: string[] | string | null,
) {
  const tagNames = parseTagNames(value);

  if (tagNames === undefined) {
    return undefined;
  }

  const tagConnections: { id: string }[] = [];

  for (const tagName of tagNames) {
    const existingTag = await prisma.tag.findFirst({
      where: {
        userId,
        name: {
          equals: tagName,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    if (existingTag) {
      tagConnections.push(existingTag);
      continue;
    }

    const createdTag = await prisma.tag.create({
      data: {
        userId,
        name: tagName,
      },
      select: {
        id: true,
      },
    });

    tagConnections.push(createdTag);
  }

  return tagConnections;
}

const getVerifiedAlbumId = async (userId: string, albumId?: string | null) => {
  if (albumId === undefined) {
    return undefined;
  }

  if (albumId === null || albumId === "" || albumId === "null") {
    return null;
  }

  const album = await prisma.album.findFirst({
    where: {
      id: albumId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!album) {
    throw new Error("Album not found");
  }

  return album.id;
};

export const getUserMemories = async (userId: string) => {
  const memories = await prisma.memory.findMany({
    where: {
      userId,
      isArchived: false,
    },
    include: memoryWithTagsInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  return memories;
};

export const getUserArchivedMemories = async (userId: string) => {
  const memories = await prisma.memory.findMany({
    where: {
      userId,
      isArchived: true,
    },
    include: memoryWithTagsInclude,
    orderBy: {
      updatedAt: "desc",
    },
  });

  return memories;
};

export const createUserMemory = async (
  userId: string,
  data: CreateMemoryRequest,
  mediaFile?: Express.Multer.File,
) => {
  const uploadedMedia = mediaFile ? await uploadMemoryImage(mediaFile) : null;

  const mediaType = mediaFile
    ? getMediaTypeFromFile(mediaFile)
    : normalizeMediaType(data.mediaType);

  const albumId = await getVerifiedAlbumId(userId, data.albumId);
  const tagConnections = await getUserTagConnections(userId, data.tags);

  const memory = await prisma.memory.create({
    data: {
      title: data.title,
      description: data.description,
      mediaUrl: uploadedMedia?.secure_url ?? data.mediaUrl,
      mediaPublicId: uploadedMedia?.public_id,
      mediaType,
      memoryDate: data.memoryDate ? new Date(data.memoryDate) : undefined,
      location: data.location,
      ...(albumId !== undefined ? { albumId } : {}),
      ...(tagConnections && tagConnections.length > 0
        ? { tags: { connect: tagConnections } }
        : {}),
      userId,
    },
    include: memoryWithTagsInclude,
  });

  try {
    await notifyUser({
      userId,
      title: "Memory created",
      message: `Your memory "${memory.title}" is ready to revisit.`,
      category: "Memories",
      type: "SUCCESS",
      icon: "📝",
      actionType: "memory",
      actionId: memory.id,
      groupKey: `memory-created:${userId}`,
      canGroup: true,
    });
  } catch (error) {
    console.warn("Failed to create memory notification", error);
  }

  return memory;
};

export const deleteUserMemory = async (userId: string, memoryId: string) => {
  const memory = await prisma.memory.findFirst({
    where: {
      id: memoryId,
      userId,
    },
  });

  if (!memory) {
    throw new Error("Memory not found");
  }

  if (memory.mediaPublicId) {
    await deleteMemoryImage(
      memory.mediaPublicId,
      getCloudinaryResourceType(memory.mediaType),
    );
  }

  await prisma.memory.delete({
    where: {
      id: memoryId,
    },
  });

  try {
    await notifyUser({
      userId,
      title: "Memory removed",
      message: `Your memory "${memory.title}" has been removed.`,
      category: "Memories",
      type: "WARNING",
      icon: "🗑️",
      actionType: "memory",
      actionId: memory.id,
    });
  } catch (error) {
    console.warn("Failed to create delete-memory notification", error);
  }

  return memory;
};

export const updateUserMemory = async (
  userId: string,
  memoryId: string,
  data: UpdateMemoryRequest,
  mediaFile?: Express.Multer.File,
) => {
  const memory = await prisma.memory.findFirst({
    where: {
      id: memoryId,
      userId,
    },
  });

  if (!memory) {
    throw new Error("Memory not found");
  }

  const albumId = await getVerifiedAlbumId(userId, data.albumId);
  const tagConnections = await getUserTagConnections(userId, data.tags);
  const uploadedMedia = mediaFile ? await uploadMemoryImage(mediaFile) : null;
  const newMediaType = mediaFile ? getMediaTypeFromFile(mediaFile) : undefined;

  if (uploadedMedia && memory.mediaPublicId) {
    await deleteMemoryImage(
      memory.mediaPublicId,
      getCloudinaryResourceType(memory.mediaType),
    );
  }

  const updatedMemory = await prisma.memory.update({
    where: {
      id: memoryId,
    },
    data: {
      title: data.title,
      description: data.description ?? null,
      location: data.location ?? null,
      memoryDate: data.memoryDate ? new Date(data.memoryDate) : null,
      ...(albumId !== undefined ? { albumId } : {}),
      ...(tagConnections !== undefined ? { tags: { set: tagConnections } } : {}),
      ...(uploadedMedia
        ? {
            mediaUrl: uploadedMedia.secure_url,
            mediaPublicId: uploadedMedia.public_id,
            mediaType: newMediaType,
          }
        : {}),
    },
    include: memoryWithTagsInclude,
  });

  try {
    await notifyUser({
      userId,
      title: "Memory updated",
      message: `Your memory "${updatedMemory.title}" was updated.`,
      category: "Memories",
      type: "SUCCESS",
      icon: "📝",
      actionType: "memory",
      actionId: updatedMemory.id,
      groupKey: `memory-updated:${updatedMemory.id}`,
      canGroup: true,
    });
  } catch (error) {
    console.warn("Failed to create update-memory notification", error);
  }

  return updatedMemory;
};

export const assignUserMemoryAlbum = async (
  userId: string,
  memoryId: string,
  albumId: string | null,
) => {
  const memory = await prisma.memory.findFirst({
    where: {
      id: memoryId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!memory) {
    throw new Error("Memory not found");
  }

  const verifiedAlbumId = await getVerifiedAlbumId(userId, albumId);

  const updatedMemory = await prisma.memory.update({
    where: {
      id: memoryId,
    },
    data: {
      albumId: verifiedAlbumId ?? null,
    },
    include: memoryWithTagsInclude,
  });

  return updatedMemory;
};

export const toggleFavoriteMemory = async (
  userId: string,
  memoryId: string,
) => {
  const memory = await prisma.memory.findFirst({
    where: {
      id: memoryId,
      userId,
    },
  });

  if (!memory) {
    throw new Error("Memory not found");
  }

  const updatedMemory = await prisma.memory.update({
    where: {
      id: memoryId,
    },
    data: {
      isFavorite: !memory.isFavorite,
    },
    include: memoryWithTagsInclude,
  });

  try {
    await notifyUser({
      userId,
      title: updatedMemory.isFavorite
        ? "Memory favorited"
        : "Memory unfavorited",
      message: updatedMemory.isFavorite
        ? `"${updatedMemory.title}" is now in your favorites.`
        : `"${updatedMemory.title}" was removed from favorites.`,
      category: "Favorites",
      type: updatedMemory.isFavorite ? "SUCCESS" : "INFO",
      icon: "⭐",
      actionType: "favorites",
      actionId: updatedMemory.id,
    });
  } catch (error) {
    console.warn("Failed to create favorite notification", error);
  }

  return updatedMemory;
};

export const toggleArchiveMemory = async (userId: string, memoryId: string) => {
  const memory = await prisma.memory.findFirst({
    where: {
      id: memoryId,
      userId,
    },
  });

  if (!memory) {
    throw new Error("Memory not found");
  }

  const updatedMemory = await prisma.memory.update({
    where: {
      id: memoryId,
    },
    data: {
      isArchived: !memory.isArchived,
    },
    include: memoryWithTagsInclude,
  });

  try {
    await notifyUser({
      userId,
      title: updatedMemory.isArchived ? "Memory archived" : "Memory restored",
      message: updatedMemory.isArchived
        ? `"${updatedMemory.title}" moved to your archive.`
        : `"${updatedMemory.title}" was restored to your memories.`,
      category: "Archive",
      type: updatedMemory.isArchived ? "INFO" : "SUCCESS",
      icon: "🗂️",
      actionType: "archive",
      actionId: updatedMemory.id,
    });
  } catch (error) {
    console.warn("Failed to create archive notification", error);
  }

  return updatedMemory;
};

export const searchMemoriesByQuery = async (userId: string, query: string) => {
  // Fetch all non-archived memories for the user
  const memories = await prisma.memory.findMany({
    where: {
      userId,
      isArchived: false,
    },
    include: memoryWithTagsInclude,
    orderBy: {
      createdAt: "desc",
    },
  });

  if (memories.length === 0) {
    return [];
  }

  // Initialize Gemini AI
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // Create a prompt that asks Gemini to identify relevant memories
  const memoryText = memories
    .map(
      (m) =>
        `ID: ${m.id}\nTitle: ${m.title}\nDescription: ${m.description || ""}\nMood: ${m.location || ""}\nTags: ${m.tags.map((tag) => tag.name).join(", ")}\nDate: ${m.memoryDate ? m.memoryDate.toISOString() : "Unknown"}\n`,
    )
    .join("\n---\n");

  const prompt = `You are an AI assistant helping users find memories based on their search query.

Given the following memories and a user's search query, identify which memories are relevant to the query. Return ONLY the IDs of the relevant memories as a JSON array. If no memories are relevant, return an empty array [].

Return ONLY valid JSON with no additional text or markdown.

User's Search Query: "${query}"

Memories:
${memoryText}

Return format: ["id1", "id2", "id3"] or [] if none are relevant.`;

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Parse the response to extract memory IDs
  let relevantIds: string[] = [];
  try {
    // Clean up the response text - remove markdown code blocks if present
    const cleanedText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    relevantIds = JSON.parse(cleanedText);

    if (!Array.isArray(relevantIds)) {
      relevantIds = [];
    }
  } catch (error) {
    console.error("Error parsing Gemini response:", responseText);
    relevantIds = [];
  }

  // Filter memories to return only the relevant ones
  const relevantMemories = memories.filter((m) => relevantIds.includes(m.id));

  return relevantMemories;
};
