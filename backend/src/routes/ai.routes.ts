import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  aiSearch,
  getAiSearchQuotaStatus,
} from "../controllers/memory.controller.js";

const router = Router();

router.get("/search/quota", authenticate, getAiSearchQuotaStatus);
router.post("/search", authenticate, aiSearch);

export default router;
