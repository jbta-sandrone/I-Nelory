import { Router } from "express";
import { changePassword, changeUsername, getMe, login, register, requestChangeEmail, updateProfile, updateAvatar, verifyEmail } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { uploadAvatarMiddleware } from "../middleware/upload.js";


const router = Router();

router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.get("/me", authenticate, getMe);

router.get("/verify-email", verifyEmail);

router.patch("/change-username", authenticate, changeUsername);

router.patch("/change-password", authenticate, changePassword);

router.patch("/change-email/request", authenticate, requestChangeEmail);

router.patch("/profile", authenticate, updateProfile);

router.patch("/profile/avatar", authenticate, uploadAvatarMiddleware, updateAvatar);

export default router;