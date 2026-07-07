import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { uploadMemoryImageMiddleware } from "../middleware/upload.js";
import {
  assignMemoryAlbum,
  createMemory,
  deleteMemory,
  getArchivedMemories,
  getMemories,
  toggleArchive,
  updateMemory,
  toggleFavorite,
} from "../controllers/memory.controller.js";
import { validate } from "../middleware/validate.js";
import {
  assignMemoryAlbumSchema,
  createMemorySchema,
  updateMemorySchema,
} from "../validators/memory.validator.js";

const router = Router();

router.get("/", authenticate, getMemories);
router.get("/archive", authenticate, getArchivedMemories);
router.post(
  "/",
  authenticate,
  uploadMemoryImageMiddleware,
  validate(createMemorySchema),
  createMemory
);

router.patch(
  "/:id",
  authenticate,
  validate(updateMemorySchema),
  updateMemory
);

router.patch(
  "/:id/favorite",
  authenticate,
  toggleFavorite
);

router.patch(
  "/:id/archive",
  authenticate,
  toggleArchive
);

router.patch(
  "/:id/album",
  authenticate,
  validate(assignMemoryAlbumSchema),
  assignMemoryAlbum
);

router.delete("/:id", authenticate, deleteMemory);

export default router;
