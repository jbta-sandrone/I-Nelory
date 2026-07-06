import express from "express";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import memoryRoutes from "./routes/memory.routes.js";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

app.get("/", (_req, res) => {
  res.send("I-Nelory Backend API 💚");
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/memories", memoryRoutes);

export default app;