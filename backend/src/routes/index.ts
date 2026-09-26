import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { scanRoutes } from "./scan.routes";

export const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

router.use("/auth", authRoutes);
router.use("/scan", scanRoutes);
