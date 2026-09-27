import { Router } from "express";
import * as activityController from "../controllers/activity.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { logActivitySchema, validateBody } from "../utils/validation";

export const activityRoutes = Router();

activityRoutes.get("/", requireAuth, asyncHandler(activityController.getActivities));
activityRoutes.post("/", requireAuth, validateBody(logActivitySchema), asyncHandler(activityController.logActivity));
activityRoutes.delete("/:id", requireAuth, asyncHandler(activityController.removeActivity));
