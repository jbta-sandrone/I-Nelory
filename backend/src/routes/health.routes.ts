import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({
    status: "success",
    message: "I-Nelory API is healthy 💚",
  });
});

export default router;