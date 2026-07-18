import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  assignUserMemoryAlbum,
  createUserMemory,
  deleteUserMemory,
  getUserArchivedMemories,
  getUserMemories,
  updateUserMemory,
  toggleArchiveMemory,
  toggleFavoriteMemory,
  searchMemoriesByQuery,
} from "../services/memory.service.js";
import {
  CreateMemoryRequest,
  UpdateMemoryRequest,
} from "../types/memory.types.js";
import { notifyUser } from "../services/notification.service.js";
import { getPrivacyPreferences } from "../services/privacy-preference.service.js";
import { StorageQuotaError } from "../services/storage.service.js";
import {
  AiSearchLimitError,
  assertAiSearchQuotaAvailable,
  getAiSearchQuotaSnapshot,
  incrementAiSearchUsage,
} from "../services/ai-search-quota.service.js";

function sendMemoryMutationError(
  res: Response,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof StorageQuotaError) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      ...error.details,
    });
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  return res.status(message === "Memory not found" ? 404 : 400).json({ message });
}

function parseRequestTags(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return [];
  }

  let rawTags: unknown;

  if (Array.isArray(value)) {
    rawTags = value;
  } else if (typeof value === "string") {
    try {
      rawTags = JSON.parse(value);
    } catch {
      throw new Error("Tags must be a JSON array.");
    }
  } else {
    throw new Error("Tags must be an array.");
  }

  if (!Array.isArray(rawTags)) {
    throw new Error("Tags must be an array.");
  }

  return rawTags.map((tag) => String(tag).trim());
}

export const getMemories = async (req: AuthRequest, res: Response) => {
    const memories = await getUserMemories(req.userId!);

    return res.json({
        message: "Memories fetched successfully 💚",
        memories,
    });
};

export const getArchivedMemories = async (req: AuthRequest, res: Response) => {
    const memories = await getUserArchivedMemories(req.userId!);

    return res.json({
        message: "Archived memories fetched successfully ðŸ’š",
        memories,
    });
};

export const createMemory = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const data = {
            ...(req.body as CreateMemoryRequest),
            tags: parseRequestTags(req.body.tags),
        };

        const memory = await createUserMemory(
            req.userId!,
            data,
            req.file
        );

        return res.status(201).json({
            message: "Memory created successfully 💚",
            memory,
        });
    } catch (error) {
        return sendMemoryMutationError(res, error, "Failed to create memory");
    }
};

export const deleteMemory = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    await deleteUserMemory(req.userId!, id);

    return res.status(200).json({
      message: "Memory deleted successfully 💚",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete memory";

    return res.status(message === "Memory not found" ? 404 : 400).json({
      message,
    });
  }
};

export const updateMemory = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data = {
      ...(req.body as UpdateMemoryRequest),
      tags: parseRequestTags(req.body.tags),
    };

    const memory = await updateUserMemory(
      req.userId!,
      id,
      data,
      req.file
    );

    return res.status(200).json({
      message: "Memory updated successfully ðŸ’š",
      memory,
    });
  } catch (error) {
    return sendMemoryMutationError(res, error, "Failed to update memory");
  }
};

export const assignMemoryAlbum = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const memory = await assignUserMemoryAlbum(
      req.userId!,
      id,
      req.body.albumId
    );

    return res.status(200).json({
      message: memory.albumId
        ? "Memory assigned to album successfully"
        : "Memory removed from album successfully",
      memory,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update memory album";

    return res
      .status(message === "Memory not found" || message === "Album not found" ? 404 : 400)
      .json({
        message,
      });
  }
};

export const toggleFavorite = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const memory = await toggleFavoriteMemory(req.userId!, id);

    return res.status(200).json({
      message: memory.isFavorite
        ? "Memory added to favorites 💚"
        : "Memory removed from favorites 💚",
      memory,
    });
  } catch (error) {
    return res.status(404).json({
      message:
        error instanceof Error ? error.message : "Failed to update favorite",
    });
  }
};

export const toggleArchive = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const memory = await toggleArchiveMemory(req.userId!, id);

    return res.status(200).json({
      message: memory.isArchived
        ? "Memory archived successfully ðŸ’š"
        : "Memory restored successfully ðŸ’š",
      memory,
    });
  } catch (error) {
    return res.status(404).json({
      message:
        error instanceof Error ? error.message : "Failed to update archive",
    });
  }
};
export const aiSearch = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { allowAiSearch } = await getPrivacyPreferences(userId);

    if (!allowAiSearch) {
      return res.status(403).json({
        success: false,
        message: "AI Search is disabled in your Privacy Settings.",
      });
    }

    const { query } = req.body as { query: string };

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    await assertAiSearchQuotaAvailable(userId);

    const memories = await searchMemoriesByQuery(userId, query.trim());
    const quota = await incrementAiSearchUsage(userId);

    try {
      await notifyUser({
        userId,
        title: "AI search complete",
        message: `Found ${memories.length} memories for your search.`,
        category: "AI",
        type: "INFO",
        icon: "✨",
        actionType: "ai-search",
        groupKey: `ai-search:${userId}`,
        canGroup: true,
      });
    } catch (notificationError) {
      console.warn("Failed to create AI search notification", notificationError);
    }

    return res.json({
      success: true,
      remaining: quota.remaining,
      data: {
        message: "AI search completed successfully ðŸ’š",
        memories,
      },
      message: "AI search completed successfully 💚",
      memories,
    });
  } catch (error) {
    if (error instanceof AiSearchLimitError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
        remaining: error.remaining,
      });
    }

    console.error("AI Search error:", error);
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "AI search failed",
    });
  }
};

export const getAiSearchQuotaStatus = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const userId = req.userId!;
    const { usageDate, quotaRow, quotaReturned } =
      await getAiSearchQuotaSnapshot(userId);

    console.log({
      userId,
      usageDate,
      quotaRow,
      quotaReturned,
    });

    return res.json({
      success: true,
      ...quotaReturned,
    });
  } catch (error) {
    console.error("AI Search quota error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load AI Search quota.",
    });
  }
};
