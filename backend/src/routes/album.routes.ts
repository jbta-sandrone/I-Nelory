import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createAlbum,
  deleteAlbum,
  getAlbum,
  getAlbums,
  updateAlbum,
  updateAlbumCover,
} from "../controllers/album.controller.js";
import { uploadAlbumCoverMiddleware } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { createAlbumSchema } from "../validators/album.validator.js";

const router = Router();

router.get("/", authenticate, getAlbums);
router.post("/", authenticate, validate(createAlbumSchema), createAlbum);
router.get("/:id", authenticate, getAlbum);
router.patch("/:id", authenticate, validate(createAlbumSchema), updateAlbum);
router.patch(
  "/:id/cover",
  authenticate,
  uploadAlbumCoverMiddleware,
  updateAlbumCover
);
router.delete("/:id", authenticate, deleteAlbum);

export default router;
