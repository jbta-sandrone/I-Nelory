import { Request, Response } from "express";
import { loginUser, registerUser } from "../services/auth.service.js";
import { LoginRequest, RegisterRequest, UpdateProfileRequest } from "../types/auth.types.js";
import { prisma } from "../config/prisma.js";
import { AuthRequest } from "../middleware/auth.js";
import { uploadAvatar, deleteAvatar } from "../services/cloudinary.service.js";

export const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response
) => {
  try {
    const result = await registerUser(req.body);

    return res.status(201).json(result);
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Registration failed",
    });
  }
};

export const login = async (
  req: Request<{}, {}, LoginRequest>,
  res: Response
) => {
  try {
    const result = await loginUser(req.body);

    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Login failed",
    });
  }
};


export const getMe = async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: {
      id: req.userId,
    },
    select: {
      id: true,
      username: true,
      email: true,
      fullName: true,
      bio: true,
      location: true,
      avatarUrl: true,
      avatarPublicId: true,
      createdAt: true,
    },
  });

  return res.status(200).json({
    user,
  });
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { fullName, bio, location } = req.body as UpdateProfileRequest;

    const updatedUser = await prisma.user.update({
      where: {
        id: req.userId,
      },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(bio !== undefined && { bio }),
        ...(location !== undefined && { location }),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        bio: true,
        location: true,
        avatarUrl: true,
        avatarPublicId: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully 💚",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to update profile",
    });
  }
};

export const updateAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file as Express.Multer.File | undefined;

    if (!file) {
      return res.status(400).json({ message: "No avatar file provided" });
    }

    // Fetch current user to get existing public id
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { avatarPublicId: true },
    });

    const previousPublicId = currentUser?.avatarPublicId;

    // Upload new avatar to Cloudinary
    const uploadResult = await uploadAvatar(file);

    if (!uploadResult || !uploadResult.secure_url || !uploadResult.public_id) {
      throw new Error("Failed to upload avatar");
    }

    // Update user with new avatar
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        avatarUrl: uploadResult.secure_url,
        avatarPublicId: uploadResult.public_id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        bio: true,
        location: true,
        avatarUrl: true,
        avatarPublicId: true,
        createdAt: true,
      },
    });

    // Delete previous avatar from Cloudinary (do this after DB update)
    if (previousPublicId) {
      try {
        await deleteAvatar(previousPublicId);
      } catch (err) {
        console.warn("Failed to delete previous avatar:", err);
      }
    }

    return res.status(200).json({ message: "Avatar updated successfully", user: updatedUser });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to update avatar",
    });
  }
};