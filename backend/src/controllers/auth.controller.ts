import { Request, Response } from "express";
import {
  changeUserPassword,
  changeUserUsername,
  loginUser,
  registerUser,
  verifyUserEmail,
} from "../services/auth.service.js";
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
      emailVerified: true,
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

export const changeUsername = async (req: AuthRequest, res: Response) => {
  try {
    const { newUsername } = req.body as {
      newUsername?: string;
    };

    if (typeof newUsername !== "string") {
      return res.status(400).json({
        message: "Username is required.",
      });
    }

    const normalizedUsername = newUsername.trim().toLowerCase();

    const updatedUser = await changeUserUsername(req.userId!, normalizedUsername);

    return res.status(200).json({
      message: "Username changed successfully.",
      user: updatedUser,
    });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to change username",
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const token = typeof req.query.token === "string" ? req.query.token : "";

    if (!token) {
      return res.status(400).json({ message: "Invalid verification link." });
    }

    await verifyUserEmail(token);

    return res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to verify email",
    });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All password fields are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirmation do not match.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters.",
      });
    }

    if (newPassword === currentPassword) {
      return res.status(400).json({
        message: "New password must be different from the current password.",
      });
    }

    await changeUserPassword(req.userId!, currentPassword, newPassword);

    return res.status(200).json({
      message: "Password changed successfully.",
    });
  } catch (error) {
    return res.status(400).json({
      message: error instanceof Error ? error.message : "Failed to change password",
    });
  }
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