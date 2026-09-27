import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { scanRoutes } from "./scan.routes";
import { logRoutes } from "./log.routes";
import { dashboardRoutes } from "./dashboard.routes";
import { userRoutes } from "./user.routes";
import { foodsRoutes } from "./foods.routes";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

router.use("/auth", authRoutes);
router.use("/scan", scanRoutes);
router.use("/logs", logRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/users", userRoutes);
router.use("/foods", foodsRoutes);
