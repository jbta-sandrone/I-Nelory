import { Request, Response } from "express";
import { getDashboardSummary } from "../services/dashboard.service.js";

type AuthenticatedRequest = Request & {
  userId?: string;
  user?: {
    id?: string;
    userId?: string;
  };
};

export async function getDashboardSummaryController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.userId || req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const summary = await getDashboardSummary(userId);

    return res.json(summary);
  } catch (error) {
    console.error("Dashboard summary error:", error);
    return res.status(500).json({ message: "Failed to load dashboard summary" });
  }
}
