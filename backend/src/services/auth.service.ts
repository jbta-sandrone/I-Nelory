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
  });

  if (!user) {
    throw new Error("Invalid username or password");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  const token = generateToken(user.id);

  if (!isPasswordCorrect) {
    throw new Error("Invalid username or password");
  }

  return {
    message: "Login successful 💚",
    token,
    user: {
      id: user.id,
      username: user.username,
      bio: user.bio,
      location: user.location,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      avatarPublicId: user.avatarPublicId ?? null,
      createdAt: user.createdAt,
    },
  };
};
