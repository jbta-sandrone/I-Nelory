const PRIVACY_PREFERENCES_API_URL =
  "http://localhost:5000/api/privacy-preferences";

export const PRIVACY_PREFERENCE_KEYS = [
  "confirmBeforeDelete",
  "allowAiSearch",
] as const;

export type PrivacyPreferenceKey =
  (typeof PRIVACY_PREFERENCE_KEYS)[number];

export type PrivacyPreferences = Record<PrivacyPreferenceKey, boolean>;

export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  confirmBeforeDelete: true,
  allowAiSearch: true,
};

type PrivacyPreferenceResponse = {
  preferences: PrivacyPreferences;
};

async function parseJsonResponse<T>(response: Response, fallback: string) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(typeof data?.message === "string" ? data.message : fallback);
  }

  return data as T;
}

export async function getPrivacyPreferences(token: string) {
  const response = await fetch(PRIVACY_PREFERENCES_API_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return parseJsonResponse<PrivacyPreferenceResponse>(
    response,
    "Unable to load privacy preferences",
  );
}

export async function updatePrivacyPreferences(
  token: string,
  updates: Partial<PrivacyPreferences>,
) {
  const response = await fetch(PRIVACY_PREFERENCES_API_URL, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  return parseJsonResponse<PrivacyPreferenceResponse>(
    response,
    "Unable to save privacy preferences",
  );
}
