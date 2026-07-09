import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { RegisterRequest, LoginRequest } from "../types/auth.types.js";
import { generateToken } from "../utils/jwt.js";
import { sendVerificationEmail } from "./email.service.js";
import { notifyUser } from "./notification.service.js";

export const registerUser = async (data: RegisterRequest) => {
  const { username, email, password } = data;

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUsername) {
    throw new Error("Username already exists");
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email },
  });

  if (existingEmail) {
    throw new Error("Email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = (await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      emailVerified: false,
    } as any,
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      emailVerified: true,
      bio: true,
      location: true,
      avatarUrl: true,
      avatarPublicId: true,
      createdAt: true,
    },
  })) as any;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.emailVerification.deleteMany({
    where: {
      userId: user.id,
      type: "SIGNUP",
    },
  });

  await prisma.emailVerification.create({
    data: {
      userId: user.id,
      token,
      type: "SIGNUP",
      pendingEmail: null,
      expiresAt,
    } as any,
  });

  try {
    await sendVerificationEmail(user.email, token, "SIGNUP");
  } catch (error) {
    console.error(
      "Failed to send verification email to",
      user.email,
      error instanceof Error ? error.message : error
    );
  }

  try {
    await notifyUser({
      userId: user.id,
      title: "Welcome to I-Nelory",
      message: "Your account is ready. Verify your email to start capturing memories.",
      category: "Account",
      type: "SUCCESS",
      icon: "✨",
      actionType: "profile",
      actionId: user.id,
    });
  } catch (error) {
    console.warn("Failed to create welcome notification", error);
  }

  return {
    message: "Account created. Please check your email to verify your account.",
    user: {
      ...user,
      emailVerified: Boolean(user.emailVerified),
    },
  };
};

export const loginUser = async (data: LoginRequest) => {
  const { username, password } = data;

  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      emailVerified: true,
      password: true,
      bio: true,
      location: true,
      avatarUrl: true,
      avatarPublicId: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("Invalid username or password");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw new Error("Invalid username or password");
  }

  if (!user.emailVerified) {
    throw new Error(
      "Please verify your email before logging in. Check your inbox for the verification link."
    );
  }

  const token = generateToken(user.id);

  return {
    message: "Login successful 💚",
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName ?? null,
      bio: user.bio,
      location: user.location,
      email: user.email,
      emailVerified: Boolean(user.emailVerified),
      avatarUrl: user.avatarUrl ?? null,
      avatarPublicId: user.avatarPublicId ?? null,
      createdAt: user.createdAt,
    },
  };
};

export const verifyUserEmail = async (token: string) => {
  const verification = await prisma.emailVerification.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      type: true,
      pendingEmail: true,
    },
  });

  if (
    !verification ||
    (verification.type !== "SIGNUP" && verification.type !== "CHANGE_EMAIL")
  ) {
    throw new Error("Invalid verification link.");
  }

  if (verification.expiresAt.getTime() < Date.now()) {
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    throw new Error("Verification link has expired.");
  }

  const verificationType = verification.type;

  if (verificationType === "CHANGE_EMAIL") {
    if (!verification.pendingEmail) {
      throw new Error("Invalid verification link.");
    }

    await prisma.user.update({
      where: { id: verification.userId },
      data: {
        email: verification.pendingEmail,
        emailVerified: true,
      } as any,
    });

    try {
      await notifyUser({
        userId: verification.userId,
        title: "Email changed",
        message: "Your account email address was updated successfully.",
        category: "Security",
        type: "SUCCESS",
        icon: "✉️",
        actionType: "settings",
        actionId: verification.userId,
      });
    } catch (error) {
      console.warn("Failed to create email change notification", error);
    }
  } else {
    await prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: true } as any,
    });

    try {
      await notifyUser({
        userId: verification.userId,
        title: "Email verified",
        message: "Your email address is now verified.",
        category: "Security",
        type: "SUCCESS",
        icon: "✓",
        actionType: "settings",
        actionId: verification.userId,
      });
    } catch (error) {
      console.warn("Failed to create verification notification", error);
    }
  }

  await prisma.emailVerification.delete({
    where: { id: verification.id },
  });

  return {
    message:
      verificationType === "CHANGE_EMAIL"
        ? "Your email address has been updated successfully. Please sign in again."
        : "Email verified successfully.",
    type: verificationType,
  };
};

export const requestEmailChange = async (
  userId: string,
  newEmail: string,
  currentPassword: string
) => {
  const trimmedEmail = newEmail.trim().toLowerCase();

  if (!trimmedEmail) {
    throw new Error("Email is required.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      password: true,
    },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const isCurrentPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isCurrentPasswordCorrect) {
    throw new Error("Current password is incorrect.");
  }

  if (user.email.toLowerCase() === trimmedEmail) {
    throw new Error("New email must be different from your current email.");
  }

  const existingEmail = await prisma.user.findUnique({
    where: { email: trimmedEmail },
  });

  if (existingEmail && existingEmail.id !== userId) {
    throw new Error("Email already exists.");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.emailVerification.deleteMany({
    where: {
      userId,
      type: "CHANGE_EMAIL",
    },
  });

  await prisma.emailVerification.create({
    data: {
      userId,
      token,
      type: "CHANGE_EMAIL",
      pendingEmail: trimmedEmail,
      expiresAt,
    } as any,
  });

  try {
    await sendVerificationEmail(trimmedEmail, token, "CHANGE_EMAIL");
  } catch (error) {
    console.error(
      "Failed to send email change verification email to",
      trimmedEmail,
      error instanceof Error ? error.message : error
    );
  }

  return {
    message: `We sent a verification link to ${trimmedEmail}. Please verify the new email to finish the change.`,
  };
};

export const changeUserUsername = async (userId: string, newUsername: string) => {
  const trimmedUsername = newUsername.trim();

  if (!trimmedUsername) {
    throw new Error("Username is required.");
  }

  const normalizedUsername = trimmedUsername.toLowerCase();

  if (normalizedUsername.length < 3) {
    throw new Error("Username must be at least 3 characters.");
  }

  if (normalizedUsername.length > 30) {
    throw new Error("Username must not exceed 30 characters.");
  }

  if (!/^[a-z0-9_.]+$/.test(normalizedUsername)) {
    throw new Error("Username can only contain letters, numbers, underscore, and dot.");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
    },
  });

  if (!currentUser) {
    throw new Error("User not found");
  }

  if (currentUser.username.toLowerCase() === normalizedUsername) {
    throw new Error("New username must be different from your current username.");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      username: normalizedUsername,
      id: { not: userId },
    },
  });

  if (existingUser) {
    throw new Error("Username is already taken.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { username: normalizedUsername },
    select: {
      id: true,
      username: true,
      fullName: true,
      email: true,
      bio: true,
      location: true,
      avatarUrl: true,
      avatarPublicId: true,
      createdAt: true,
    },
  });

  try {
    await notifyUser({
      userId,
      title: "Username updated",
      message: `Your username is now ${updatedUser.username}.`,
      category: "Account",
      type: "SUCCESS",
      icon: "👤",
      actionType: "settings",
      actionId: userId,
    });
  } catch (error) {
    console.warn("Failed to create username notification", error);
  }

  return updatedUser;
};

export const changeUserPassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isCurrentPasswordCorrect = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!isCurrentPasswordCorrect) {
    throw new Error("Current password is incorrect.");
  }

  if (newPassword.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }

  if (newPassword === currentPassword) {
    throw new Error("New password must be different from the current password.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  try {
    await notifyUser({
      userId,
      title: "Password updated",
      message: "Your password was changed successfully.",
      category: "Security",
      type: "SUCCESS",
      icon: "🔐",
      actionType: "settings",
      actionId: userId,
    });
  } catch (error) {
    console.warn("Failed to create password notification", error);
  }
};
