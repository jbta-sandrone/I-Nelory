import { prisma } from "../config/prisma.js";
import {
  serializeMemory,
  serializeNullableMemory,
} from "../utils/memory-serializer.js";

const nonArchivedMemoryWhere = (userId: string) => ({
  userId,
  isArchived: false,
});

function hasMedia(memory: { mediaUrl?: string | null }) {
  return Boolean(memory.mediaUrl?.trim());
}

function isSameMonthDay(date: Date | null, today: Date) {
  return Boolean(
    date &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate(),
  );
}

function getYear(date: Date | null) {
  return date?.getFullYear() || 0;
}

const memoryTagsInclude = {
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
  album: {
    select: {
      id: true,
      name: true,
    },
  },
};

export async function getDashboardSummary(userId: string) {
  const today = new Date();

  const [
    memories,
    albums,
    favorites,
    archived,
    favoriteWithImage,
    latestMemoriesWithImages,
    recentMemories,
    recentAlbums,
    onThisDayCandidates,
  ] = await Promise.all([
    prisma.memory.count({
      where: nonArchivedMemoryWhere(userId),
    }),
    prisma.album.count({
      where: { userId },
    }),
    prisma.memory.count({
      where: {
        ...nonArchivedMemoryWhere(userId),
        isFavorite: true,
      },
    }),
    prisma.memory.count({
      where: {
        userId,
        isArchived: true,
      },
    }),
    prisma.memory.findFirst({
      where: {
        ...nonArchivedMemoryWhere(userId),
        isFavorite: true,
        mediaUrl: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: memoryTagsInclude,
    }),
    prisma.memory.findMany({
      where: {
        ...nonArchivedMemoryWhere(userId),
        mediaUrl: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: memoryTagsInclude,
      take: 10,
    }),
    prisma.memory.findMany({
      where: nonArchivedMemoryWhere(userId),
      orderBy: {
        createdAt: "desc",
      },
      include: memoryTagsInclude,
      take: 6,
    }),
    prisma.album.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
      take: 4,
      include: {
        _count: {
          select: {
            memories: true,
          },
        },
      },
    }),
    prisma.memory.findMany({
      where: {
        ...nonArchivedMemoryWhere(userId),
        memoryDate: {
          not: null,
        },
      },
      orderBy: {
        memoryDate: "desc",
      },
      include: memoryTagsInclude,
    }),
  ]);

  const memoryOfTheDay =
    favoriteWithImage && hasMedia(favoriteWithImage)
      ? favoriteWithImage
      : latestMemoriesWithImages.find(hasMedia) || null;

  const onThisDay = onThisDayCandidates
    .filter((memory) => isSameMonthDay(memory.memoryDate, today))
    .sort((first, second) => getYear(second.memoryDate) - getYear(first.memoryDate))
    .slice(0, 3);

  return {
    stats: {
      memories,
      albums,
      favorites,
      archived,
    },
    memoryOfTheDay: serializeNullableMemory(memoryOfTheDay),
    recentMemories: recentMemories.map(serializeMemory),
    recentAlbums: recentAlbums.map((album) => ({
      ...album,
      memoryCount: album._count.memories,
    })),
    onThisDay: onThisDay.map(serializeMemory),
  };
}
