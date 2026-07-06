import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createMemory,
  deleteMemory,
  getMemories,
  updateMemory,
} from "../controllers/memory.controller.js";
import { validate } from "../middleware/validate.js";
import {
  createMemorySchema,
  updateMemorySchema,
} from "../validators/memory.validator.js";

const router = Router();

router.get("/", authenticate, getMemories);
router.post(
  "/",
  authenticate,
  validate(createMemorySchema),
  createMemory
);

router.patch(
  "/:id",
  authenticate,
  validate(updateMemorySchema),
  updateMemory
);
router.delete("/:id", authenticate, deleteMemory);

export default router;
