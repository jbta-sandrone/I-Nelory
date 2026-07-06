export interface CreateMemoryRequest {
  title: string;
  description?: string;
  mediaUrl?: string;
  mediaType?: "IMAGE" | "VIDEO";
  memoryDate?: string;
  location?: string;
}

export interface UpdateMemoryRequest {
  title: string;
  description?: string | null;
  memoryDate?: string | null;
  location?: string | null;
}
