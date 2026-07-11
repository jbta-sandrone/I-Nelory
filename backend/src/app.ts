import express from "express";
import dashboardRoutes from "./routes/dashboard.routes.js";
import cors from "cors";
import healthRoutes from "./routes/health.routes.js";
import authRoutes from "./routes/auth.routes.js";
import memoryRoutes from "./routes/memory.routes.js";
import albumRoutes from "./routes/album.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import notificationPreferenceRoutes from "./routes/notification-preference.routes.js";

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
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/memories", memoryRoutes);
app.use("/api/albums", albumRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/notification-preferences", notificationPreferenceRoutes);

export default app;
