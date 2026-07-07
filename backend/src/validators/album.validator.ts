import { z } from "zod";

export const createAlbumSchema = z.object({
  name: z.string().min(1, "Album name is required"),
  description: z.string().optional(),
});