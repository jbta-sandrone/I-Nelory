import { z } from "zod";

const tagsSchema = z
  .union([z.string(), z.array(z.unknown())])
  .nullable()
  .optional();

export const createMemorySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(["image", "video"]).optional(),
  memoryDate: z.string().optional(),
  location: z.string().optional(),
  albumId: z.string().nullable().optional(),
  tags: tagsSchema,
});

export const updateMemorySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  memoryDate: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  albumId: z.string().nullable().optional(),
  tags: tagsSchema,
});

export const assignMemoryAlbumSchema = z.object({
  albumId: z.string().nullable(),
});
