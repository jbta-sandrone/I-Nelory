import { prisma } from "../config/prisma.js";

export const NOTIFICATION_PREFERENCE_FIELDS = [
  "notifyMemoryActivity",
  "notifyAlbumActivity",
  "notifyFavoriteActivity",
  "notifyAiSearch",
  "notifyMemoryReminders",
  "notifyOnThisDay",
  "notifyStorageAlerts",
] as const;

export type NotificationPreferenceField =
  (typeof NOTIFICATION_PREFERENCE_FIELDS)[number];

export type NotificationPreferences = Record<NotificationPreferenceField, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  notifyMemoryActivity: true,
  notifyAlbumActivity: true,
  notifyFavoriteActivity: true,
  notifyAiSearch: true,
  notifyMemoryReminders: true,
  notifyOnThisDay: true,
  notifyStorageAlerts: true,
};

const preferenceSelect = {
  notifyMemoryActivity: true,
  notifyAlbumActivity: true,
  notifyFavoriteActivity: true,
  notifyAiSearch: true,
  notifyMemoryReminders: true,
  notifyOnThisDay: true,
  notifyStorageAlerts: true,
} as const;

function toPreferences(value: Partial<NotificationPreferences> | null) {
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(value ?? {}),
  };
}

export async function getNotificationPreferences(userId: string) {
  const preferences = await prisma.notificationPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: preferenceSelect,
  });

  return toPreferences(preferences);
}

export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>,
) {
  const preferences = await prisma.notificationPreference.upsert({
    where: { userId },
    update: updates,
    create: {
      userId,
      ...updates,
    },
    select: preferenceSelect,
  });

  return toPreferences(preferences);
}

export async function areNotificationPreferencesEnabled(
  userId: string,
  fields: NotificationPreferenceField[],
) {
  const preferences = await prisma.notificationPreference.findUnique({
    where: { userId },
    select: preferenceSelect,
  });
  const resolvedPreferences = toPreferences(preferences);

  return fields.every((field) => resolvedPreferences[field]);
}
