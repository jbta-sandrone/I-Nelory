const API_BASE_URL = "http://localhost:5000/api";

export type AlbumOption = {
  id: string;
  name: string;
  coverUrl?: string | null;
  memories?: Array<{
    id: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
  }>;
  _count?: {
    memories?: number;
  };
};

function getApiMessage(data: unknown, fallback: string) {
  if (typeof data === "object" && data !== null) {
    const payload = data as { message?: unknown };

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message;
    }
  }

  return fallback;
}

export async function getAlbumOptions(token: string, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/albums`, {
    headers: { Authorization: `Bearer ${token}` },
    signal,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(getApiMessage(data, "Unable to load albums."));
  }

  const payload = data as { albums?: AlbumOption[] } | null;
  return payload?.albums ?? [];
}

export async function setMemoryAlbum<TMemory>(
  token: string,
  memoryId: string,
  albumId: string | null,
) {
  const response = await fetch(
    `${API_BASE_URL}/memories/${encodeURIComponent(memoryId)}/album`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ albumId }),
    },
  );
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      getApiMessage(
        data,
        albumId ? "Unable to add the memory to this album." : "Unable to remove the memory from its album.",
      ),
    );
  }

  return data as { message: string; memory: TMemory };
}
