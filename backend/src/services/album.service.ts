import { prisma } from "../config/prisma.js";
import {
  deleteAlbumCover,
  uploadAlbumCover,
} from "./cloudinary.service.js";
import { notifyUser } from "./notification.service.js";

const albumListInclude = {
  memories: {
    select: {
      id: true,
      mediaUrl: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc" as const,
    },
    take: 1,
  },
  _count: {
    select: {
      memories: true,
    },
  },
};

export const getUserAlbums = async (userId: string) => {
  return prisma.album.findMany({
    where: { userId },
    include: albumListInclude,
    orderBy: { createdAt: "desc" },
  });
};

export const createUserAlbum = async (
  userId: string,
  data: { name: string; description?: string }
) => {
  const album = await prisma.album.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
  });

  try {
    await notifyUser({
      userId,
      title: "Album created",
      message: `Your album "${album.name}" is ready.`,
      category: "Albums",
      type: "SUCCESS",
      icon: "🗂️",
      actionType: "album",
      actionId: album.id,
      groupKey: `album-created:${userId}`,
      canGroup: true,
    });
  } catch (error) {
    console.warn("Failed to create album notification", error);
  }

  return album;
};

export const updateUserAlbum = async (
  userId: string,
  albumId: string,
  data: { name: string; description?: string }
) => {
  const updateResult = await prisma.album.updateMany({
    where: {
      id: albumId,
      userId,
    },
    data: {
      name: data.name,
      description: data.description ?? null,
    },
  });

  if (updateResult.count === 0) {
    throw new Error("Album not found");
  }

  const album = await prisma.album.findFirst({
    where: {
      id: albumId,
      userId,
    },
    include: albumListInclude,
  });

  if (!album) {
    throw new Error("Album not found");
  }

  return album;
};

export const getUserAlbumById = async (userId: string, albumId: string) => {
  const album = await prisma.album.findFirst({
    where: {
      id: albumId,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      coverUrl: true,
      coverPublicId: true,
      createdAt: true,
      memories: {
        where: {
          userId,
          isArchived: false,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!album) {
    throw new Error("Album not found");
  }

  return album;
};

export const updateUserAlbumCover = async (
  userId: string,
  albumId: string,
  imageFile?: Express.Multer.File
) => {
  if (!imageFile) {
    throw new Error("Album cover image is required");
  }

  const album = await prisma.album.findFirst({
    where: {
      id: albumId,
      userId,
    },
  });

  if (!album) {
    throw new Error("Album not found");
  }

  const uploadedCover = await uploadAlbumCover(imageFile);

  if (album.coverPublicId) {
    await deleteAlbumCover(album.coverPublicId);
  }

  const updatedAlbum = await prisma.album.update({
    where: {
      id: albumId,
    },
    data: {
      coverUrl: uploadedCover.secure_url,
      coverPublicId: uploadedCover.public_id,
    },
    include: albumListInclude,
  });

  return updatedAlbum;
};

export const deleteUserAlbum = async (userId: string, albumId: string) => {
  const album = await prisma.album.findFirst({
    where: {
      id: albumId,
      userId,
    },
  });

  if (!album) {
    throw new Error("Album not found");
  }

  // Delete album cover from Cloudinary if it exists
  if (album.coverPublicId) {
    await deleteAlbumCover(album.coverPublicId);
  }

  // Set all memories in this album to have no album (albumId = null)
  // Then delete the album
  await prisma.$transaction([
    prisma.memory.updateMany({
      where: {
        albumId,
        userId,
      },
      data: {
        albumId: null,
      },
    }),
    prisma.album.delete({
      where: {
        id: albumId,
      },
    }),
  ]);

  return album;
};
