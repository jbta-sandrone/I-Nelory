import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  createUserAlbum,
  deleteUserAlbum,
  getUserAlbumById,
  getUserAlbums,
  updateUserAlbum,
  updateUserAlbumCover,
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

export const getAlbum = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const album = await getUserAlbumById(req.userId!, id);

    return res.status(200).json({
      message: "Album fetched successfully 💚",
      album,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch album";

    return res.status(message === "Album not found" ? 404 : 400).json({
      message,
    });
  }
};

export const updateAlbum = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const album = await updateUserAlbum(req.userId!, id, req.body);

    return res.status(200).json({
      message: "Album updated successfully 💚",
      album,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update album";

    return res.status(message === "Album not found" ? 404 : 400).json({
      message,
    });
  }
};

export const updateAlbumCover = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const album = await updateUserAlbumCover(req.userId!, id, req.file);

    return res.status(200).json({
      message: "Album cover updated successfully 💚",
      album,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update album cover";

    return res.status(message === "Album not found" ? 404 : 400).json({
      message,
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
