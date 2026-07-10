import multer from "multer";
import type { NextFunction, Request, Response } from "express";

const imageMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const uploadMemoryImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_VIDEO_SIZE,
  },
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/") && !file.mimetype.startsWith("video/")) {
      callback(new Error("Only image or video uploads are supported"));
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

const uploadAvatar = multer({
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
}).single("avatar");

export const uploadMemoryImageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadMemoryImage(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message: error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE"
          ? "Videos must be 50 MB or smaller, and images must be 5 MB or smaller"
          : error instanceof Error ? error.message : "Failed to upload media",
      });
    }

    if (req.file?.mimetype.startsWith("image/") && req.file.size > MAX_IMAGE_SIZE) {
      return res.status(400).json({
        message: "Images must be 5 MB or smaller",
      });
    }

    if (req.file?.mimetype.startsWith("video/") && req.file.size > MAX_VIDEO_SIZE) {
      return res.status(400).json({
        message: "Videos must be 50 MB or smaller",
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

export const uploadAvatarMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadAvatar(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        message:
          error instanceof Error ? error.message : "Failed to upload image",
      });
    }

    return next();
  });
};
