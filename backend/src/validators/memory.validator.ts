import { z } from "zod";

export const createMemorySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().optional(),
  mediaUrl: z.string().optional(),
  mediaType: z.enum(["IMAGE", "VIDEO"]).optional(),
  memoryDate: z.string().optional(),
  location: z.string().optional(),
});

export const updateMemorySchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  memoryDate: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
});
