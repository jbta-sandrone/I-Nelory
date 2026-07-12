import { API_BASE_URL } from "../config/api";

export type StorageSummary = {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  usagePercentage: number;
  totalMemories: number;
  totalMediaFiles: number;
  imageCount: number;
  videoCount: number;
  archivedCount: number;
  imageBytes: number;
  videoBytes: number;
  archivedBytes: number;
  unknownMediaCount: number;
  hasUnknownUsage: boolean;
};

export async function getStorageSummary(token: string) {
  const response = await fetch(`${API_BASE_URL}/api/storage/summary`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : "Unable to load storage usage",
    );
  }

  return data as StorageSummary;
}
