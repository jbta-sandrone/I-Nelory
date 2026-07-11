import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  getPrivacyPreferences,
  PRIVACY_PREFERENCE_FIELDS,
  type PrivacyPreferenceField,
  type PrivacyPreferences,
  updatePrivacyPreferences,
} from "../services/privacy-preference.service.js";

function parsePreferenceUpdates(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new Error("Privacy preferences must be an object.");
  }

  const entries = Object.entries(body);
  const allowedFields = new Set<string>(PRIVACY_PREFERENCE_FIELDS);

  if (entries.length === 0) {
    throw new Error("At least one privacy preference is required.");
  }

  const updates: Partial<PrivacyPreferences> = {};

  for (const [key, value] of entries) {
    if (!allowedFields.has(key) || typeof value !== "boolean") {
      throw new Error(`Invalid privacy preference: ${key}.`);
    }

    updates[key as PrivacyPreferenceField] = value;
  }

  return updates;
}

export const readPrivacyPreferences = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const preferences = await getPrivacyPreferences(req.userId!);
    return res.status(200).json({ preferences });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to load privacy preferences",
    });
  }
};

export const patchPrivacyPreferences = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const updates = parsePreferenceUpdates(req.body);
    const preferences = await updatePrivacyPreferences(req.userId!, updates);
    return res.status(200).json({ preferences });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to update privacy preferences",
    });
  }
};
