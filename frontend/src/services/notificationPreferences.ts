const NOTIFICATION_PREFERENCES_API_URL =
  "http://localhost:5000/api/notification-preferences";

export const NOTIFICATION_PREFERENCE_KEYS = [
  "notifyMemoryActivity",
  "notifyAlbumActivity",
  "notifyFavoriteActivity",
  "notifyAiSearch",
  "notifyMemoryReminders",
  "notifyOnThisDay",
  "notifyStorageAlerts",
] as const;

export type NotificationPreferenceKey =
  (typeof NOTIFICATION_PREFERENCE_KEYS)[number];

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  notifyMemoryActivity: true,
  notifyAlbumActivity: true,
  notifyFavoriteActivity: true,
  notifyAiSearch: true,
  notifyMemoryReminders: true,
  notifyOnThisDay: true,
  notifyStorageAlerts: true,
};

type NotificationPreferenceResponse = {
  preferences: NotificationPreferences;
};

async function parseJsonResponse<T>(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : fallback);
  }

  return data as T;
}

export async function getNotificationPreferences(token: string) {
  const response = await fetch(NOTIFICATION_PREFERENCES_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonResponse<NotificationPreferenceResponse>(
    response,
    "Unable to load notification preferences",
  );
}

export async function updateNotificationPreferences(
  token: string,
  updates: Partial<NotificationPreferences>,
) {
  const response = await fetch(NOTIFICATION_PREFERENCES_API_URL, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  return parseJsonResponse<NotificationPreferenceResponse>(
    response,
    "Unable to save notification preferences",
  );
}
