import { Router } from "express";
import {
  patchNotificationPreferences,
  readNotificationPreferences,
} from "../controllers/notification-preference.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, readNotificationPreferences);
router.patch("/", authenticate, patchNotificationPreferences);

export default router;
