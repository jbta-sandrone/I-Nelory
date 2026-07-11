import { Router } from "express";
import { getUserStorageSummary } from "../controllers/storage.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/summary", authenticate, getUserStorageSummary);

export default router;
