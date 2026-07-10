import type { ApiTag } from "../utils/memoryMetadata";

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_URL = rawApiUrl.replace(/\/$/, "");
const API_BASE_URL = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;

export type DashboardMemory = {
  id: string;
  title?: string | null;
  description?: string | null;
  content?: string | null;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "IMAGE" | "VIDEO" | null;
  imageUrl?: string | null;
  memoryDate?: string | Date | null;
  location?: string | null;
  tags?: ApiTag[];
  createdAt?: string | Date | null;
  isFavorite?: boolean;
  media?: Array<string | { url?: string | null }>;
};

export type DashboardAlbum = {
  id: string;
  title?: string | null;
  name?: string | null;
  coverUrl?: string | null;
  imageUrl?: string | null;
  memoryCount?: number;
  _count?: {
    memories?: number;
  };
};

export type DashboardSummary = {
  stats: {
    memories: number;
    albums: number;
    favorites: number;
    archived: number;
  };
  memoryOfTheDay: DashboardMemory | null;
  recentMemories: DashboardMemory[];
  recentAlbums: DashboardAlbum[];
  onThisDay: DashboardMemory[];
};

function getStoredToken() {
  return (
    localStorage.getItem("i-nelory.auth.token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken") ||
    ""
  );
}

export async function getDashboardSummary(token?: string | null) {
  const authToken = token || getStoredToken();

  const response = await fetch(`${API_BASE_URL}/dashboard/summary`, {
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.message || payload?.error || "Dashboard summary could not load.",
    );
  }

  return (payload?.data || payload) as DashboardSummary;
}
