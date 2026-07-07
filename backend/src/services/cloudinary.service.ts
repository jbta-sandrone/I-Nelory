import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";

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

export const uploadMemoryImage = async (
  file: Express.Multer.File
): Promise<UploadApiResponse> => {
  configureCloudinary();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "i-nelory/memories",
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

export const deleteMemoryImage = async (publicId: string) => {
  configureCloudinary();

  const result = (await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  })) as { result?: string };

  if (result.result !== "ok") {
    throw new Error(
      result.result === "not found"
        ? "Cloudinary image was not found"
        : "Failed to delete image from Cloudinary"
    );
  }

  return result;
};
