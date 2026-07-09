import { prisma } from "../config/prisma.js";

const GROUP_WINDOW_MS = 2 * 60 * 1000;
const NOTIFICATION_LIMIT = 1000;

export type NotificationCategory =
  | "Memories"
  | "Albums"
  | "Favorites"
  | "Archive"
  | "AI"
  | "Account"
  | "Security"
  | "Reminder"
  | "Storage";

function buildGroupedTitle(title: string, count: number) {
  const trimmedTitle = title.trim();

  if (!trimmedTitle || count <= 1) {
    return trimmedTitle;
  }

  return `${count} ${trimmedTitle.toLowerCase()}`;
}

function buildGroupedMessage(message: string, count: number) {
  const trimmedMessage = message.trim();

  if (!trimmedMessage || count <= 1) {
    return trimmedMessage;
  }

  return `${count} ${trimmedMessage.toLowerCase()}`;
}

async function enforceNotificationLimit(userId: string) {
  const totalCount = await prisma.notification.count({
    where: { userId },
  });

  if (totalCount <= NOTIFICATION_LIMIT) {
    return;
  }

  const excessCount = totalCount - NOTIFICATION_LIMIT;

  const readNotifications = await prisma.notification.findMany({
    where: { userId, isRead: true },
    orderBy: { updatedAt: "asc" },
    take: excessCount,
  });

  if (readNotifications.length > 0) {
    await prisma.notification.deleteMany({
      where: {
        id: { in: readNotifications.map((notification) => notification.id) },
      },
    });
  }

  const remainingCount = await prisma.notification.count({
    where: { userId },
  });

  if (remainingCount > NOTIFICATION_LIMIT) {
    const overflowNotifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { updatedAt: "asc" },
      take: remainingCount - NOTIFICATION_LIMIT,
    });

    if (overflowNotifications.length > 0) {
      await prisma.notification.deleteMany({
        where: {
          id: { in: overflowNotifications.map((notification) => notification.id) },
        },
      });
    }
  }
}

export const createNotification = async ({
  userId,
  title,
  message,
  category,
  type,
  icon,
  actionType,
  actionId,
  groupKey,
  canGroup,
}: {
  userId: string;
  title: string;
  message: string;
  category: NotificationCategory;
  type?: string;
  icon?: string | null;
  actionType?: string | null;
  actionId?: string | null;
  groupKey?: string | null;
  canGroup?: boolean;
}) => {
  const notificationCategory = category || "Account";
  const notificationType = type || "INFO";
  const notificationIcon = icon || "🔔";

  if (canGroup && groupKey) {
    const cutoff = new Date(Date.now() - GROUP_WINDOW_MS);
    const existingGroupNotification = await prisma.notification.findFirst({
      where: {
        userId,
        category: notificationCategory,
        groupKey,
        updatedAt: {
          gte: cutoff,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (existingGroupNotification) {
      const nextCount = (existingGroupNotification.groupCount ?? 1) + 1;
      const updatedNotification = await prisma.notification.update({
        where: { id: existingGroupNotification.id },
        data: {
          title: buildGroupedTitle(title, nextCount),
          message: buildGroupedMessage(message, nextCount),
          isRead: false,
          groupCount: nextCount,
          updatedAt: new Date(),
          actionType: actionType ?? existingGroupNotification.actionType,
          actionId: actionId ?? existingGroupNotification.actionId,
          icon: notificationIcon,
          type: notificationType,
        } as any,
      });

      await enforceNotificationLimit(userId);
      return updatedNotification as any;
    }
  }

  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      category: notificationCategory,
      type: notificationType,
      icon: notificationIcon,
      actionType,
      actionId,
      groupKey,
      groupCount: 1,
      isRead: false,
    } as any,
  });

  await enforceNotificationLimit(userId);
  return notification as any;
};

export const notifyUser = createNotification;

export const getUserNotifications = async (userId: string, filter = "All") => {
  const where: Record<string, unknown> = { userId };

  if (filter === "Unread") {
    where.isRead = false;
  } else if (filter !== "All") {
    where.category = filter;
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: where as any,
      orderBy: { updatedAt: "desc" } as any,
    }),
    prisma.notification.count({
      where: { userId, isRead: false } as any,
    }),
  ]);

  return {
    notifications: notifications as any[],
    unreadCount,
  };
};

export const markNotificationAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    return null;
  }

  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true } as any,
  });
};

export const markAllNotificationsRead = async (userId: string) => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true } as any,
  });
};

export const deleteNotification = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId },
  });

  if (!notification) {
    return null;
  }

  await prisma.notification.delete({
    where: { id: notificationId },
  });

  return true;
};

export const clearNotifications = async (userId: string) => {
  await prisma.notification.deleteMany({
    where: { userId },
  });
};
