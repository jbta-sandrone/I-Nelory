import { prisma } from "../config/prisma.js";

export const getUserAlbums = async (userId: string) => {
  return prisma.album.findMany({
    where: { userId },
    include: {
      memories: {
        select: {
          id: true,
          mediaUrl: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      _count: {
        select: {
          memories: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const createUserAlbum = async (
  userId: string,
  data: { name: string; description?: string }
) => {
  return prisma.album.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
  });
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
