import { Router } from "express";
import {
  clearAllNotifications,
  listNotifications,
  readAllNotifications,
  readNotification,
  removeNotification,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, listNotifications);
router.patch("/:id/read", authenticate, readNotification);
router.patch("/read-all", authenticate, readAllNotifications);
router.delete("/:id", authenticate, removeNotification);
router.delete("/", authenticate, clearAllNotifications);

export default router;
