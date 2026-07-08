import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { RegisterRequest, LoginRequest } from "../types/auth.types.js";
import { generateToken } from "../utils/jwt.js";

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

  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
    },
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

  return {
    message: "User registered successfully 💚",
    user,
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
      avatarUrl: user.avatarUrl ?? null,
      avatarPublicId: user.avatarPublicId ?? null,
      createdAt: user.createdAt,
    },
  };
};
