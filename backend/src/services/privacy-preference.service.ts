import { prisma } from "../config/prisma.js";

export const PRIVACY_PREFERENCE_FIELDS = [
  "confirmBeforeDelete",
  "allowAiSearch",
] as const;

export type PrivacyPreferenceField =
  (typeof PRIVACY_PREFERENCE_FIELDS)[number];

export type PrivacyPreferences = Record<PrivacyPreferenceField, boolean>;

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  confirmBeforeDelete: true,
  allowAiSearch: true,
};

const preferenceSelect = {
  confirmBeforeDelete: true,
  allowAiSearch: true,
} as const;

function toPreferences(value: Partial<PrivacyPreferences> | null) {
  return {
    ...DEFAULT_PRIVACY_PREFERENCES,
    ...(value ?? {}),
  };
}

export async function getPrivacyPreferences(userId: string) {
  const preferences = await prisma.privacyPreference.upsert({
    where: { userId },
    update: {},
    create: { userId },
    select: preferenceSelect,
  });

  return toPreferences(preferences);
}

export async function updatePrivacyPreferences(
  userId: string,
  updates: Partial<PrivacyPreferences>,
) {
  const preferences = await prisma.privacyPreference.upsert({
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
