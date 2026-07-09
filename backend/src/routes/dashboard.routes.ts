import { Router } from "express";
import { getDashboardSummaryController } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/summary", authenticate, getDashboardSummaryController);

export default router;
