import { prisma } from "../config/prisma.js";
import {
  deleteMemoryImage,
  uploadMemoryImage,
} from "./cloudinary.service.js";
import {
  CreateMemoryRequest,
  UpdateMemoryRequest,
} from "../types/memory.types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const getVerifiedAlbumId = async (
  userId: string,
  albumId?: string | null
) => {
  if (albumId === undefined) {
    return undefined;
  }

  if (albumId === null) {
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
    orderBy: {
      updatedAt: "desc",
    },
  });

  return memories;
};

export const createUserMemory = async (
  userId: string,
  data: CreateMemoryRequest,
  imageFile?: Express.Multer.File
) => {
  const uploadedImage = imageFile ? await uploadMemoryImage(imageFile) : null;
  const albumId = await getVerifiedAlbumId(userId, data.albumId);

  const memory = await prisma.memory.create({
    data: {
      title: data.title,
      description: data.description,
      mediaUrl: uploadedImage?.secure_url ?? data.mediaUrl,
      mediaPublicId: uploadedImage?.public_id,
      mediaType: uploadedImage ? "IMAGE" : data.mediaType,
      memoryDate: data.memoryDate ? new Date(data.memoryDate) : undefined,
      location: data.location,
      ...(albumId !== undefined ? { albumId } : {}),
      userId,
    },
  });

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
    await deleteMemoryImage(memory.mediaPublicId);
  }

  await prisma.memory.delete({
    where: {
      id: memoryId,
    },
  });

  return memory;
};

export const updateUserMemory = async (
  userId: string,
  memoryId: string,
  data: UpdateMemoryRequest
) => {
  const albumId = await getVerifiedAlbumId(userId, data.albumId);
  const updateResult = await prisma.memory.updateMany({
    where: {
      id: memoryId,
      userId,
    },
    data: {
      title: data.title,
      description: data.description ?? null,
      location: data.location ?? null,
      memoryDate: data.memoryDate ? new Date(data.memoryDate) : null,
      ...(albumId !== undefined ? { albumId } : {}),
    },
  });

  if (updateResult.count === 0) {
    throw new Error("Memory not found");
  }

  const updatedMemory = await prisma.memory.findFirst({
    where: {
      id: memoryId,
      userId,
    },
  });

  if (!updatedMemory) {
    throw new Error("Memory not found");
  }

  return updatedMemory;
};

export const assignUserMemoryAlbum = async (
  userId: string,
  memoryId: string,
  albumId: string | null
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
  });

  return updatedMemory;
};

export const toggleFavoriteMemory = async (
  userId: string,
  memoryId: string
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
  });

  return updatedMemory;
};

export const toggleArchiveMemory = async (
  userId: string,
  memoryId: string
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
      isArchived: !memory.isArchived,
    },
  });

  return updatedMemory;
};

export const searchMemoriesByQuery = async (
  userId: string,
  query: string
) => {
  // Fetch all non-archived memories for the user
  const memories = await prisma.memory.findMany({
    where: {
      userId,
      isArchived: false,
    },
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
        `ID: ${m.id}\nTitle: ${m.title}\nDescription: ${m.description || ""}\nLocation: ${m.location || ""}\nDate: ${m.memoryDate ? m.memoryDate.toISOString() : "Unknown"}\n`
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
