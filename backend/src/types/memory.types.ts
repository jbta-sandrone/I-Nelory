export interface CreateMemoryRequest {
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaPublicId?: string;
  mediaType?: "IMAGE" | "VIDEO";
  memoryDate?: string;
  location?: string;
  albumId?: string | null;
}

export interface UpdateMemoryRequest {
  title: string;
  description?: string | null;
  memoryDate?: string | null;
  location?: string | null;
  albumId?: string | null;
}
