import { Router } from "express";
import {
  exportAccount,
  removeAccount,
} from "../controllers/account.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.get("/export", authenticate, exportAccount);
router.delete("/", authenticate, removeAccount);

export default router;
