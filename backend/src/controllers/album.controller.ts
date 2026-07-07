import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  createUserAlbum,
  deleteUserAlbum,
  getUserAlbums,
} from "../services/album.service.js";

export const getAlbums = async (req: AuthRequest, res: Response) => {
  const albums = await getUserAlbums(req.userId!);

  return res.json({
    message: "Albums fetched successfully 💚",
    albums,
  });
};

export const createAlbum = async (req: AuthRequest, res: Response) => {
  try {
    const album = await createUserAlbum(req.userId!, req.body);

    return res.status(201).json({
      message: "Album created successfully 💚",
      album,
    });
  } catch {
    return res.status(400).json({
      message: "Failed to create album",
    });
  }
};

export const deleteAlbum = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    await deleteUserAlbum(req.userId!, id);

    return res.status(200).json({
      message: "Album deleted successfully 💚",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete album";

    return res.status(message === "Album not found" ? 404 : 400).json({
      message,
    });
  }
};
