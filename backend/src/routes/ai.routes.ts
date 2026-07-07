import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { aiSearch } from "../controllers/memory.controller.js";

const router = Router();

router.post("/search", authenticate, aiSearch);

export default router;
