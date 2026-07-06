import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  createUserMemory,
  deleteUserMemory,
  getUserMemories,
  updateUserMemory,
} from "../services/memory.service.js";
import {
  CreateMemoryRequest,
  UpdateMemoryRequest,
} from "../types/memory.types.js";

export const getMemories = async (req: AuthRequest, res: Response) => {
    const memories = await getUserMemories(req.userId!);

    return res.json({
        message: "Memories fetched successfully 💚",
        memories,
    });
};

export const createMemory = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const memory = await createUserMemory(
            req.userId!,
            req.body as CreateMemoryRequest
        );

        return res.status(201).json({
            message: "Memory created successfully 💚",
            memory,
        });
    } catch (error) {
        return res.status(400).json({
            message: error instanceof Error ? error.message : "Failed to create memory",
        });
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
    return res.status(404).json({
      message: error instanceof Error ? error.message : "Failed to delete memory",
    });
  }
};

export const updateMemory = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const memory = await updateUserMemory(
      req.userId!,
      id,
      req.body as UpdateMemoryRequest
    );

    return res.status(200).json({
      message: "Memory updated successfully ðŸ’š",
      memory,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update memory";

    return res.status(message === "Memory not found" ? 404 : 400).json({
      message,
    });
  }
};
