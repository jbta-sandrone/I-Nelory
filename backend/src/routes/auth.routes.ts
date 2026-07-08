import { Router } from "express";
import { getMe, login, register, updateProfile, updateAvatar } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { uploadAvatarMiddleware } from "../middleware/upload.js";


const router = Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.get("/me", authenticate, getMe);

router.patch("/profile", authenticate, updateProfile);

router.patch("/profile/avatar", authenticate, uploadAvatarMiddleware, updateAvatar);

export default router;