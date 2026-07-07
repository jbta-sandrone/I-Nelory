import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createAlbum,
  deleteAlbum,
  getAlbums,
} from "../controllers/album.controller.js";
import { validate } from "../middleware/validate.js";
import { createAlbumSchema } from "../validators/album.validator.js";

const router = Router();

router.get("/", authenticate, getAlbums);
router.post("/", authenticate, validate(createAlbumSchema), createAlbum);
router.delete("/:id", authenticate, deleteAlbum);

export default router;
