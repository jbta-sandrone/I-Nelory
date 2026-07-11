import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  calculateStorageUsage,
  getStorageSummary,
} from "../services/storage.service.js";

export const getUserStorageSummary = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const usage = await calculateStorageUsage(req.userId!);
    return res.status(200).json(getStorageSummary(usage));
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Failed to load storage summary",
    });
  }
};
