import { prisma } from "../config/prisma.js";
import {
  deleteMemoryImage,
  uploadMemoryImage,
} from "./cloudinary.service.js";
import {
  CreateMemoryRequest,
  UpdateMemoryRequest,
} from "../types/memory.types.js";

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
