import { Router } from "express";
import * as dashboardController from "../controllers/dashboard.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

export const dashboardRoutes = Router();

dashboardRoutes.get("/summary", requireAuth, asyncHandler(dashboardController.getSummary));
dashboardRoutes.get("/insight", requireAuth, asyncHandler(dashboardController.getInsight));
dashboardRoutes.get("/plan", requireAuth, asyncHandler(dashboardController.getPlan));
