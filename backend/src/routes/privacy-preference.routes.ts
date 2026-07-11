import { Router } from "express";
import {
  patchPrivacyPreferences,
  readPrivacyPreferences,
} from "../controllers/privacy-preference.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, readPrivacyPreferences);
router.patch("/", authenticate, patchPrivacyPreferences);

export default router;
