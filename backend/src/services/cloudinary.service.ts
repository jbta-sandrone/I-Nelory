import { v2 as cloudinary } from "cloudinary";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";

let configured = false;

const configureCloudinary = () => {
  if (configured) {
    return;
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  configured = true;
};

const uploadImage = async (
  file: Express.Multer.File,
  folder: string
): Promise<UploadApiResponse> => {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

const uploadMedia = async (
  file: Express.Multer.File,
  folder: string,
  resourceType: UploadApiOptions["resource_type"] = "auto"
): Promise<UploadApiResponse> => {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};

const deleteMedia = async (
  publicId: string,
  resourceType: "image" | "video" = "image"
) => {
  configureCloudinary();

  const result = (await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  })) as { result?: string };

  if (result.result !== "ok") {
    throw new Error(
      result.result === "not found"
        ? "Cloudinary media was not found"
        : "Failed to delete media from Cloudinary"
    );
  }

  return result;
};

const deleteImage = async (publicId: string) => {
  return deleteMedia(publicId, "image");
};

export const uploadMemoryImage = async (file: Express.Multer.File) => {
  return uploadMedia(file, "i-nelory/memories", "auto");
};

export const deleteMemoryImage = async (
  publicId: string,
  resourceType: "image" | "video" = "image"
) => {
  return deleteMedia(publicId, resourceType);
};

export const getMemoryMediaResource = async (
  publicId: string,
  resourceType: "image" | "video" = "image",
) => {
  configureCloudinary();

  return cloudinary.api.resource(publicId, {
    resource_type: resourceType,
  }) as Promise<{ bytes?: number }>;
};

export const uploadAlbumCover = async (file: Express.Multer.File) => {
  return uploadImage(file, "i-nelory/albums");
};

export const deleteAlbumCover = async (publicId: string) => {
  return deleteImage(publicId);
};

export const uploadAvatar = async (file: Express.Multer.File) => {
  return uploadImage(file, "i-nelory/avatars");
};

export const deleteAvatar = async (publicId: string) => {
  return deleteImage(publicId);
};

export const deleteAccountCloudinaryResource = async (
  publicId: string,
  resourceType: "image" | "video",
) => {
  configureCloudinary();

  const result = (await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  })) as { result?: string };

  if (result.result === "ok" || result.result === "not found") {
    return;
  }

  throw new Error("Cloudinary resource cleanup failed");
};
