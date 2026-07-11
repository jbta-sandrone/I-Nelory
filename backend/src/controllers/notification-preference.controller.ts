import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  getNotificationPreferences,
  NOTIFICATION_PREFERENCE_FIELDS,
  type NotificationPreferenceField,
  type NotificationPreferences,
  updateNotificationPreferences,
} from "../services/notification-preference.service.js";

function parsePreferenceUpdates(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Notification preferences must be an object.");
  }

  const entries = Object.entries(body);
  const allowedFields = new Set<string>(NOTIFICATION_PREFERENCE_FIELDS);

  if (entries.length === 0) {
    throw new Error("At least one notification preference is required.");
  }

  const updates: Partial<NotificationPreferences> = {};

  for (const [key, value] of entries) {
    if (!allowedFields.has(key) || typeof value !== "boolean") {
      throw new Error(`Invalid notification preference: ${key}.`);
    }

    updates[key as NotificationPreferenceField] = value;
  }

  return updates;
}

export const readNotificationPreferences = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const preferences = await getNotificationPreferences(req.userId!);
    return res.status(200).json({ preferences });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to load notification preferences",
    });
  }
};

export const patchNotificationPreferences = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const updates = parsePreferenceUpdates(req.body);
    const preferences = await updateNotificationPreferences(
      req.userId!,
      updates,
    );

    return res.status(200).json({ preferences });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to update notification preferences",
    });
  }
};
