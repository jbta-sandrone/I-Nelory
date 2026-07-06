import { prisma } from "../config/prisma.js";
import {
  CreateMemoryRequest,
  UpdateMemoryRequest,
} from "../types/memory.types.js";

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

export const createUserMemory = async (
  userId: string,
  data: CreateMemoryRequest
) => {
  const memory = await prisma.memory.create({
    data: {
      title: data.title,
      description: data.description,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      memoryDate: data.memoryDate ? new Date(data.memoryDate) : undefined,
      location: data.location,
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
