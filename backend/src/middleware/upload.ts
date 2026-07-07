import multer from "multer";
import type { NextFunction, Request, Response } from "express";

const imageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const uploadMemoryImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!imageMimeTypes.has(file.mimetype)) {
      callback(new Error("Only image uploads are supported for now"));
      return;
    }

    callback(null, true);
  },
}).single("image");

const uploadAlbumCover = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    if (!imageMimeTypes.has(file.mimetype)) {
      callback(new Error("Only image uploads are supported for now"));
      return;
    }

    callback(null, true);
  },
}).single("cover");

export const uploadMemoryImageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadMemoryImage(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to upload image",
      });
    }

    return next();
  });
};

export const uploadAlbumCoverMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadAlbumCover(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to upload image",
      });
    }

    return next();
  });
};
