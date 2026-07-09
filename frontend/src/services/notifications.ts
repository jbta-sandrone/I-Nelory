const NOTIFICATIONS_API_BASE_URL = "http://localhost:5000/api/notifications";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  category: string;
  type?: string;
  icon?: string | null;
  isRead: boolean;
  actionType?: string | null;
  actionId?: string | null;
  groupKey?: string | null;
  groupCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type NotificationListResponse = {
  notifications: NotificationItem[];
  unreadCount: number;
};

async function parseJsonResponse<T>(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : fallback);
  }

  return data as T;
}

export async function getNotifications(token: string, filter = "All") {
  const query = new URLSearchParams({ filter });
  const response = await fetch(`${NOTIFICATIONS_API_BASE_URL}?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonResponse<NotificationListResponse>(response, "Unable to load notifications");
}

export async function markNotificationRead(token: string, notificationId: string) {
  const response = await fetch(`${NOTIFICATIONS_API_BASE_URL}/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonResponse<{ message: string }>(response, "Unable to mark notification as read");
}

export async function markAllNotificationsRead(token: string) {
  const response = await fetch(`${NOTIFICATIONS_API_BASE_URL}/read-all`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonResponse<{ message: string }>(response, "Unable to mark notifications as read");
}

export async function deleteNotification(token: string, notificationId: string) {
  const response = await fetch(`${NOTIFICATIONS_API_BASE_URL}/${notificationId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonResponse<{ message: string }>(response, "Unable to delete notification");
}

export async function clearAllNotifications(token: string) {
  const response = await fetch(`${NOTIFICATIONS_API_BASE_URL}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonResponse<{ message: string }>(response, "Unable to clear notifications");
}
